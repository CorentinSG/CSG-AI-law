[CmdletBinding()]
param(
    [string]$DumpPath,
    [string]$ManifestPath,
    [string]$ManifestChecksumPath,
    [string]$ExpectedTargetIdentity,
    [switch]$ConfirmDisposableTarget,
    [switch]$SelfTest
)

$ErrorActionPreference = "Stop"

function ConvertFrom-PostgresUri([string]$Value) {
    try { $uri = [Uri]$Value } catch { throw "RESTORE_TEST_DATABASE_URL must be a valid PostgreSQL URI." }
    if ($uri.Scheme -notin @("postgres", "postgresql") -or [string]::IsNullOrWhiteSpace($uri.Host)) { throw "RESTORE_TEST_DATABASE_URL must be a valid PostgreSQL URI." }
    $separator = $uri.UserInfo.IndexOf(":")
    if ($separator -lt 1) { throw "RESTORE_TEST_DATABASE_URL must include username and password." }
    $parts = @($uri.UserInfo.Substring(0, $separator), $uri.UserInfo.Substring($separator + 1))
    $database = [Uri]::UnescapeDataString($uri.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($database)) { throw "RESTORE_TEST_DATABASE_URL must include a database name." }
    $port = if ($uri.IsDefaultPort) { 5432 } else { $uri.Port }
    [pscustomobject]@{ Host=$uri.Host.ToLowerInvariant(); Port=$port; User=[Uri]::UnescapeDataString($parts[0]); Password=[Uri]::UnescapeDataString($parts[1]); Database=$database; Identity=("{0}:{1}/{2}" -f $uri.Host.ToLowerInvariant(),$port,$database.ToLowerInvariant()) }
}
function Assert-RestoreConfiguration([string]$TargetUrl, [switch]$ConfirmDisposableTarget, [string]$ExpectedTargetIdentity, [string]$SourceIdentity) {
    if ([string]::IsNullOrWhiteSpace($TargetUrl)) { throw "RESTORE_TEST_DATABASE_URL is required." }
    if (-not $ConfirmDisposableTarget) { throw "-ConfirmDisposableTarget is required because restore is destructive." }
    if ([string]::IsNullOrWhiteSpace($ExpectedTargetIdentity)) { throw "-ExpectedTargetIdentity is required." }
    $target = ConvertFrom-PostgresUri $TargetUrl
    if (-not $target.Identity.Equals($ExpectedTargetIdentity.Trim().ToLowerInvariant(), [StringComparison]::Ordinal)) { throw "Expected target identity does not match RESTORE_TEST_DATABASE_URL." }
    if ($target.Identity.Equals($SourceIdentity.Trim().ToLowerInvariant(), [StringComparison]::Ordinal)) { throw "Restore target endpoint is equivalent to the backup source endpoint." }
    $target
}
function Get-PgRestoreArguments($Connection, [string]$DumpPath) { @("--exit-on-error","--clean","--if-exists","--no-owner","--no-acl","--host",$Connection.Host,"--port","$($Connection.Port)","--username",$Connection.User,"--dbname",$Connection.Database,$DumpPath) }
function Get-CountArguments($Connection, [string]$Table) { @("--no-psqlrc","--tuples-only","--no-align","--host",$Connection.Host,"--port","$($Connection.Port)","--username",$Connection.User,"--dbname",$Connection.Database,"--command","select count(*) from public.$Table;") }
function Assert-RequiredTools([string[]]$Names, [scriptblock]$CommandLookup = { param($name) Get-Command $name -ErrorAction SilentlyContinue }) { foreach ($name in $Names) { if (-not (& $CommandLookup $name)) { throw "$name was not found on PATH." } } }
function Assert-CommandSucceeded([int]$ExitCode, [string]$Operation) { if ($ExitCode -ne 0) { throw "$Operation failed with exit code $ExitCode." } }
function Assert-ManifestIntegrity([byte[]]$ManifestBytes, [string]$ExpectedHash) {
    $sha = [Security.Cryptography.SHA256]::Create()
    try { $actual = ([BitConverter]::ToString($sha.ComputeHash($ManifestBytes))).Replace("-","").ToLowerInvariant() } finally { $sha.Dispose() }
    if ($actual -ne $ExpectedHash.Trim().ToLowerInvariant()) { throw "Manifest checksum verification failed." }
}
function Assert-ManifestDumpBinding([string]$ManifestDumpName, [string]$DumpPath) {
    if ($ManifestDumpName -ne [IO.Path]::GetFileName($ManifestDumpName) -or $ManifestDumpName -ne [IO.Path]::GetFileName($DumpPath)) { throw "Manifest filename binding is invalid." }
}
function Assert-DumpIntegrity([string]$ActualHash, [string]$ExpectedHash) {
    if ($ActualHash.Trim().ToLowerInvariant() -ne $ExpectedHash.Trim().ToLowerInvariant()) { throw "Dump checksum verification failed." }
}
function Assert-ArtifactPathBinding([string]$DumpPath, [string]$ManifestPath, [string]$ManifestChecksumPath) {
    $expectedManifest = [IO.Path]::GetFullPath("$DumpPath.manifest.json")
    $expectedChecksum = [IO.Path]::GetFullPath("$expectedManifest.sha256")
    if ([IO.Path]::GetFullPath($ManifestPath) -ne $expectedManifest -or [IO.Path]::GetFullPath($ManifestChecksumPath) -ne $expectedChecksum) {
        throw "Backup artifact path binding is invalid."
    }
}
function Compare-SnapshotCounts($Expected, $Actual) {
    foreach ($property in $Expected.PSObject.Properties) {
        if ("$($property.Value)" -ne "$($Actual[$property.Name])") { throw "Count mismatch for $($property.Name): expected $($property.Value), got $($Actual[$property.Name])." }
    }
}
function ConvertTo-PgPassField([string]$Value) { $Value.Replace("\","\\").Replace(":","\:") }
function Invoke-WithPgPass($Connection, [scriptblock]$Action) {
    $path = Join-Path ([IO.Path]::GetTempPath()) ("csg-pgpass-{0}.tmp" -f [Guid]::NewGuid().ToString("N")); $previous=$env:PGPASSFILE
    try {
        $line=@($Connection.Host,$Connection.Port,$Connection.Database,$Connection.User,$Connection.Password)|ForEach-Object{ConvertTo-PgPassField "$_"}
        [IO.File]::WriteAllText($path,($line -join ":")+[Environment]::NewLine,[Text.UTF8Encoding]::new($false))
        if($env:OS -eq "Windows_NT"){& icacls $path /inheritance:r /grant:r ("{0}:(R,W)" -f [Environment]::UserName)|Out-Null;Assert-CommandSucceeded $LASTEXITCODE "PGPASSFILE permission restriction"}
        $env:PGPASSFILE=$path;& $Action
    } finally { if($null -eq $previous){Remove-Item Env:PGPASSFILE -ErrorAction SilentlyContinue}else{$env:PGPASSFILE=$previous};Remove-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue }
}

if ($SelfTest) {
    $failures=0
    function Test-Case([string]$Name,[scriptblock]$Body){try{& $Body;Write-Host "PASS: $Name"}catch{$script:failures++;Write-Host "FAIL: $Name - $($_.Exception.Message)"}}
    function Assert-Throws([scriptblock]$Body,[string]$Pattern){try{& $Body;throw "Expected operation to fail"}catch{if($_.Exception.Message -eq "Expected operation to fail"){throw};if($_.Exception.Message -notlike $Pattern){throw "Expected '$Pattern', got '$($_.Exception.Message)'"}}}
    function Assert-Equal($Expected,$Actual){if($Expected -ne $Actual){throw "Expected '$Expected', got '$Actual'"}}
    Test-Case "restore requires RESTORE_TEST_DATABASE_URL" { Assert-Throws { Assert-RestoreConfiguration $null -ConfirmDisposableTarget -ExpectedTargetIdentity "target:5432/db" -SourceIdentity "source:5432/db" } "*RESTORE_TEST_DATABASE_URL*" }
    Test-Case "restore requires destructive confirmation" { Assert-Throws { Assert-RestoreConfiguration "postgresql://u:p@target/db" -ExpectedTargetIdentity "target:5432/db" -SourceIdentity "source:5432/db" } "*ConfirmDisposableTarget*" }
    Test-Case "restore rejects target identity mismatch" { Assert-Throws { Assert-RestoreConfiguration "postgresql://u:p@target/db" -ConfirmDisposableTarget -ExpectedTargetIdentity "other:5432/db" -SourceIdentity "source:5432/db" } "*identity*" }
    Test-Case "restore refuses equivalent endpoints despite credential and query differences" { Assert-Throws { Assert-RestoreConfiguration "postgresql://other:new@DB.EXAMPLE:5432/app?sslmode=require" -ConfirmDisposableTarget -ExpectedTargetIdentity "db.example:5432/app" -SourceIdentity "db.example:5432/app" } "*source*" }
    Test-Case "pg_restore arguments are exact and credential free" { $c=ConvertFrom-PostgresUri "postgresql://operator:secret@target.example:5433/disposable";Assert-Equal "--exit-on-error --clean --if-exists --no-owner --no-acl --host target.example --port 5433 --username operator --dbname disposable safe.dump" ((Get-PgRestoreArguments $c "safe.dump") -join " ") }
    Test-Case "checksum rejection occurs before restore" { Assert-Throws { Assert-ManifestIntegrity ([Text.Encoding]::UTF8.GetBytes("{}")) ("a"*64) } "*checksum*" }
    Test-Case "dump checksum rejection occurs before restore" { Assert-Throws { Assert-DumpIntegrity ("a"*64) ("b"*64) } "*checksum*" }
    Test-Case "manifest rejects filename traversal" { Assert-Throws { Assert-ManifestDumpBinding "..\safe.dump" "C:\backups\safe.dump" } "*filename*" }
    Test-Case "artifact sidecars reject path substitution" { Assert-Throws { Assert-ArtifactPathBinding "C:\backups\safe.dump" "C:\other\safe.dump.manifest.json" "C:\other\safe.dump.manifest.json.sha256" } "*binding*" }
    Test-Case "count mismatch is rejected" { Assert-Throws { Compare-SnapshotCounts ([pscustomobject]@{news_items=3}) @{news_items=2} } "*news_items*" }
    Test-Case "missing tools fail through injected command lookup" { Assert-Throws { Assert-RequiredTools @("pg_restore","psql") {param($name)$null} } "*not found*" }
    Test-Case "external restore failure is rejected" { Assert-Throws { Assert-CommandSucceeded 1 "pg_restore" } "*pg_restore*" }
    Test-Case "PGPASSFILE is removed after failure" { $c=ConvertFrom-PostgresUri "postgresql://u:p@host/db";Assert-Throws { Invoke-WithPgPass $c {throw "probe"} } "*probe*";Assert-Equal $null $env:PGPASSFILE }
    if($failures){exit 1};Write-Host "Self-test passed: restore safety checks";exit 0
}

foreach($path in @($DumpPath,$ManifestPath,$ManifestChecksumPath)){if(-not(Test-Path -LiteralPath $path -PathType Leaf)){throw "Required backup artifact not found."}}
Assert-ArtifactPathBinding $DumpPath $ManifestPath $ManifestChecksumPath
$manifestBytes=[IO.File]::ReadAllBytes([IO.Path]::GetFullPath($ManifestPath))
$manifestText=[Text.Encoding]::UTF8.GetString($manifestBytes)
$expectedManifestHash=(Get-Content -LiteralPath $ManifestChecksumPath -Raw).Trim()
Assert-ManifestIntegrity $manifestBytes $expectedManifestHash
$manifest=$manifestText|ConvertFrom-Json
Assert-ManifestDumpBinding $manifest.dumpFile $DumpPath
$actualDumpHash=(Get-FileHash -Algorithm SHA256 -LiteralPath $DumpPath).Hash.ToLowerInvariant()
Assert-DumpIntegrity $actualDumpHash "$($manifest.dumpSha256)"
$target=Assert-RestoreConfiguration $env:RESTORE_TEST_DATABASE_URL -ConfirmDisposableTarget:$ConfirmDisposableTarget -ExpectedTargetIdentity $ExpectedTargetIdentity -SourceIdentity $manifest.sourceIdentity
Remove-Item Env:RESTORE_TEST_DATABASE_URL -ErrorAction SilentlyContinue
Assert-RequiredTools @("pg_restore","psql")
Invoke-WithPgPass $target {
    & pg_restore @(Get-PgRestoreArguments $target $DumpPath);Assert-CommandSucceeded $LASTEXITCODE "pg_restore"
    $actual=@{}
    foreach($property in $manifest.counts.PSObject.Properties){$value=(& psql @(Get-CountArguments $target $property.Name)).Trim();Assert-CommandSucceeded $LASTEXITCODE "Count query for $($property.Name)";$actual[$property.Name]=$value}
    Compare-SnapshotCounts $manifest.counts $actual
}
Write-Host "Restore verification passed against confirmed disposable target $($target.Identity)."
