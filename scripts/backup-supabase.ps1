[CmdletBinding()]
param([string]$BackupDirectory, [switch]$SelfTest)

$ErrorActionPreference = "Stop"
$CriticalTables = @("regulation_sources", "raw_regulatory_items", "ai_regulatory_updates", "news_items", "scan_jobs", "country_intelligence")

function Assert-BackupConfiguration([string]$DatabaseUrl) {
    if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) { throw "DATABASE_URL is required." }
}
function ConvertFrom-PostgresUri([string]$Value) {
    try { $uri = [Uri]$Value } catch { throw "DATABASE_URL must be a valid PostgreSQL URI." }
    if ($uri.Scheme -notin @("postgres", "postgresql") -or [string]::IsNullOrWhiteSpace($uri.Host)) {
        throw "DATABASE_URL must be a valid PostgreSQL URI."
    }
    $separator = $uri.UserInfo.IndexOf(":")
    if ($separator -lt 1) { throw "DATABASE_URL must include username and password." }
    $parts = @($uri.UserInfo.Substring(0, $separator), $uri.UserInfo.Substring($separator + 1))
    $database = [Uri]::UnescapeDataString($uri.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($database)) { throw "DATABASE_URL must include a database name." }
    $port = if ($uri.IsDefaultPort) { 5432 } else { $uri.Port }
    [pscustomobject]@{
        Host = $uri.Host.ToLowerInvariant()
        Port = $port
        User = [Uri]::UnescapeDataString($parts[0])
        Password = [Uri]::UnescapeDataString($parts[1])
        Database = $database
        Identity = "{0}:{1}/{2}" -f $uri.Host.ToLowerInvariant(), $port, $database.ToLowerInvariant()
    }
}
function Resolve-BackupOutputPath([string]$Directory, [string]$FileName) {
    if ([string]::IsNullOrWhiteSpace($Directory)) { throw "An explicit -BackupDirectory is required." }
    $root = [IO.Path]::GetFullPath($Directory)
    $leaf = [IO.Path]::GetFileName($FileName)
    if ([string]::IsNullOrWhiteSpace($leaf)) { throw "A backup filename is required." }
    $path = [IO.Path]::GetFullPath((Join-Path $root $leaf))
    if (-not $path.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Backup output must remain under the explicit backup directory."
    }
    $path
}
function Get-PgDumpArguments($Connection, [string]$OutputPath, [string]$SnapshotId) {
    $arguments = @("--format=custom", "--no-owner", "--no-acl")
    if (-not [string]::IsNullOrWhiteSpace($SnapshotId)) {
        Assert-SnapshotId $SnapshotId
        $arguments += "--snapshot=$SnapshotId"
    }
    $arguments + @("--host", $Connection.Host, "--port", "$($Connection.Port)", "--username", $Connection.User, "--dbname", $Connection.Database, "--file", $OutputPath)
}
function Assert-SnapshotId([string]$SnapshotId) {
    if ($SnapshotId -notmatch "^[0-9A-Fa-f]+-[0-9A-Fa-f]+-[0-9A-Fa-f]+$") { throw "Invalid exported snapshot id." }
}
function Get-SnapshotCountArguments($Connection, [string]$Table, [string]$SnapshotId) {
    if ($Table -notin $CriticalTables) { throw "Count table is not in the fixed allowlist." }
    Assert-SnapshotId $SnapshotId
    $sql = "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY; SET TRANSACTION SNAPSHOT '$SnapshotId'; SELECT count(*) FROM public.$Table; COMMIT;"
    @("--no-psqlrc", "--tuples-only", "--no-align", "--set", "ON_ERROR_STOP=1", "--host", $Connection.Host, "--port", "$($Connection.Port)", "--username", $Connection.User, "--dbname", $Connection.Database, "--command", $sql)
}
function Start-SnapshotExporter($Connection, [int]$TimeoutMilliseconds = 10000) {
    $startInfo = New-Object Diagnostics.ProcessStartInfo
    $startInfo.FileName = "psql"
    $startInfo.Arguments = "--no-psqlrc --quiet --tuples-only --no-align --set ON_ERROR_STOP=1"
    $startInfo.UseShellExecute = $false
    $startInfo.RedirectStandardInput = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $startInfo.CreateNoWindow = $true
    $startInfo.EnvironmentVariables["PGHOST"] = $Connection.Host
    $startInfo.EnvironmentVariables["PGPORT"] = "$($Connection.Port)"
    $startInfo.EnvironmentVariables["PGUSER"] = $Connection.User
    $startInfo.EnvironmentVariables["PGDATABASE"] = $Connection.Database
    $process = New-Object Diagnostics.Process
    $process.StartInfo = $startInfo
    if (-not $process.Start()) { throw "Failed to start snapshot exporter." }
    try {
        $process.StandardInput.WriteLine("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;")
        $process.StandardInput.WriteLine("SELECT 'CSG_SNAPSHOT=' || pg_export_snapshot();")
        $process.StandardInput.Flush()
        $deadline = [DateTime]::UtcNow.AddMilliseconds($TimeoutMilliseconds)
        while ([DateTime]::UtcNow -lt $deadline) {
            $remaining = [Math]::Max(1, [int]($deadline - [DateTime]::UtcNow).TotalMilliseconds)
            $readTask = $process.StandardOutput.ReadLineAsync()
            if (-not $readTask.Wait($remaining)) { break }
            $line = $readTask.Result
            if ($null -eq $line) { break }
            if ($line -match "^CSG_SNAPSHOT=(.+)$") {
                Assert-SnapshotId $Matches[1]
                return [pscustomobject]@{ Process = $process; SnapshotId = $Matches[1] }
            }
        }
        throw "Snapshot exporter timed out before returning an id."
    } catch {
        if (-not $process.HasExited) { $process.Kill() }
        $process.Dispose()
        throw
    }
}
function Close-SnapshotExporter($State, [scriptblock]$SendRollback = {
    param($state)
    $state.Process.StandardInput.WriteLine("ROLLBACK;")
    $state.Process.StandardInput.WriteLine("\q")
    $state.Process.StandardInput.Flush()
    $state.Process.StandardInput.Close()
}, [scriptblock]$WaitForExit = { param($state, $timeout) $state.Process.WaitForExit($timeout) }, [scriptblock]$Kill = { param($state) if (-not $state.Process.HasExited) { $state.Process.Kill() } }) {
    if ($null -eq $State) { return }
    try {
        & $SendRollback $State
        if (-not (& $WaitForExit $State 5000)) { & $Kill $State }
    } finally {
        if ($State.PSObject.Properties.Name -contains "Process") { $State.Process.Dispose() }
    }
}
function Remove-BackupArtifacts([string]$DumpPath, [scriptblock]$RemovePath = { param($path) Remove-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue }) {
    foreach ($path in @($DumpPath, "$DumpPath.manifest.json", "$DumpPath.manifest.json.sha256")) { & $RemovePath $path }
}
function Assert-RequiredTools([string[]]$Names, [scriptblock]$CommandLookup = { param($name) Get-Command $name -ErrorAction SilentlyContinue }) {
    foreach ($name in $Names) { if (-not (& $CommandLookup $name)) { throw "$name was not found on PATH." } }
}
function Assert-CommandSucceeded([int]$ExitCode, [string]$Operation) {
    if ($ExitCode -ne 0) { throw "$Operation failed with exit code $ExitCode." }
}
function ConvertTo-PgPassField([string]$Value) { $Value.Replace("\", "\\").Replace(":", "\:") }
function Invoke-WithPgPass($Connection, [scriptblock]$Action) {
    $path = Join-Path ([IO.Path]::GetTempPath()) ("csg-pgpass-{0}.tmp" -f [Guid]::NewGuid().ToString("N"))
    $previous = $env:PGPASSFILE
    try {
        $line = @($Connection.Host, $Connection.Port, $Connection.Database, $Connection.User, $Connection.Password) | ForEach-Object { ConvertTo-PgPassField "$_" }
        [IO.File]::WriteAllText($path, ($line -join ":") + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
        if ($env:OS -eq "Windows_NT") {
            & icacls $path /inheritance:r /grant:r ("{0}:(R,W)" -f [Environment]::UserName) | Out-Null
            Assert-CommandSucceeded $LASTEXITCODE "PGPASSFILE permission restriction"
        }
        $env:PGPASSFILE = $path
        & $Action
    } finally {
        if ($null -eq $previous) { Remove-Item Env:PGPASSFILE -ErrorAction SilentlyContinue } else { $env:PGPASSFILE = $previous }
        Remove-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue
    }
}
function New-BackupManifest([string]$DumpName, [string]$DumpHash, [string]$SourceIdentity, [string]$SnapshotId, $Counts) {
    [ordered]@{ version = 2; dumpFile = $DumpName; dumpSha256 = $DumpHash; sourceIdentity = $SourceIdentity; snapshotId = $SnapshotId; createdUtc = [DateTime]::UtcNow.ToString("o"); counts = $Counts }
}

if ($SelfTest) {
    $failures = 0
    function Test-Case([string]$Name, [scriptblock]$Body) { try { & $Body; Write-Host "PASS: $Name" } catch { $script:failures++; Write-Host "FAIL: $Name - $($_.Exception.Message)" } }
    function Assert-Throws([scriptblock]$Body) { try { & $Body; throw "Expected operation to fail" } catch { if ($_.Exception.Message -eq "Expected operation to fail") { throw } } }
    function Assert-Equal($Expected, $Actual) { if ($Expected -ne $Actual) { throw "Expected '$Expected', got '$Actual'" } }
    Test-Case "missing DATABASE_URL fails before external execution" { Assert-Throws { Assert-BackupConfiguration $null } }
    Test-Case "output path remains inside explicit backup directory" { $root = Join-Path ([IO.Path]::GetTempPath()) "backup-self-test"; $path = Resolve-BackupOutputPath $root "..\escape.dump"; Assert-Equal $true ($path.StartsWith([IO.Path]::GetFullPath($root) + [IO.Path]::DirectorySeparatorChar)) }
    Test-Case "pg_dump uses required flags and non-secret connection args" { $c = ConvertFrom-PostgresUri "postgresql://operator:secret@example.invalid:5433/app?sslmode=require"; Assert-Equal "--format=custom --no-owner --no-acl --host example.invalid --port 5433 --username operator --dbname app --file test.dump" ((Get-PgDumpArguments $c "test.dump" $null) -join " ") }
    Test-Case "native arguments contain no credentials" { $c = ConvertFrom-PostgresUri "postgresql://operator:secret@example.invalid/app"; $args = Get-SnapshotCountArguments $c "news_items" "00000003-0000001B-1"; Assert-Equal $false (($args -join " ").Contains("secret")); Assert-Equal $false (($args -join " ").Contains("postgresql://")) }
    Test-Case "missing tools fail through injected command lookup" { Assert-Throws { Assert-RequiredTools @("pg_dump", "psql") { param($name) $null } } }
    Test-Case "external command failure is rejected" { Assert-Throws { Assert-CommandSucceeded 2 "pg_dump" } }
    Test-Case "manifest binds dump name and snapshot counts" { $m = New-BackupManifest "safe.dump" ("a" * 64) "db.example:5432/app" "00000003-0000001B-1" @{ news_items = 7 }; Assert-Equal "safe.dump" $m.dumpFile; Assert-Equal 7 $m.counts.news_items; Assert-Equal "00000003-0000001B-1" $m.snapshotId }
    Test-Case "PGPASSFILE is removed after failure" { $c = ConvertFrom-PostgresUri "postgresql://u:p@host/db"; Assert-Throws { Invoke-WithPgPass $c { throw "probe" } }; Assert-Equal $null $env:PGPASSFILE }
    Test-Case "dump and counts use the same exported snapshot" {
        $c = ConvertFrom-PostgresUri "postgresql://u:p@host/db"
        $snapshot = "00000003-0000001B-1"
        $dumpArgs = Get-PgDumpArguments $c "test.dump" $snapshot
        $countArgs = Get-SnapshotCountArguments $c "news_items" $snapshot
        Assert-Equal $true (($dumpArgs -join " ").Contains("--snapshot=$snapshot"))
        Assert-Equal $true (($countArgs -join " ").Contains("SET TRANSACTION SNAPSHOT '$snapshot'"))
    }
    Test-Case "snapshot id rejects SQL metacharacters" {
        Assert-Throws { Assert-SnapshotId "bad';drop table x;--" }
    }
    Test-Case "exporter cleanup rolls back and kills after timeout" {
        $state = [pscustomobject]@{ RollbackSent = $false; Waited = $false; Killed = $false }
        Close-SnapshotExporter -State $state -SendRollback { param($s) $s.RollbackSent = $true } -WaitForExit { param($s,$timeout) $s.Waited = $true; $false } -Kill { param($s) $s.Killed = $true }
        Assert-Equal $true $state.RollbackSent
        Assert-Equal $true $state.Waited
        Assert-Equal $true $state.Killed
    }
    Test-Case "backup failure cleanup removes all artifacts" {
        $removed = New-Object System.Collections.ArrayList
        Remove-BackupArtifacts -DumpPath "a.dump" -RemovePath { param($path) $null = $removed.Add($path) }
        Assert-Equal "a.dump|a.dump.manifest.json|a.dump.manifest.json.sha256" (($removed.ToArray()) -join "|")
    }
    if ($failures) { exit 1 }; Write-Host "Self-test passed: backup safety checks"; exit 0
}

Assert-BackupConfiguration $env:DATABASE_URL
$connection = ConvertFrom-PostgresUri $env:DATABASE_URL
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
Assert-RequiredTools @("pg_dump", "psql")
$name = "supabase-{0}.dump" -f (Get-Date -Format "yyyyMMdd-HHmmss")
$outputPath = Resolve-BackupOutputPath $BackupDirectory $name
$null = New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($outputPath)) -Force
$backupState = [pscustomobject]@{ SnapshotId = $null; Counts = [ordered]@{} }
try {
    Invoke-WithPgPass $connection {
        $exporter = $null
        try {
            $exporter = Start-SnapshotExporter $connection
            $backupState.SnapshotId = $exporter.SnapshotId
            & pg_dump @(Get-PgDumpArguments $connection $outputPath $exporter.SnapshotId)
            Assert-CommandSucceeded $LASTEXITCODE "pg_dump"
            foreach ($table in $CriticalTables) {
                $lines = & psql @(Get-SnapshotCountArguments $connection $table $exporter.SnapshotId)
                Assert-CommandSucceeded $LASTEXITCODE "Snapshot count query for $table"
                $value = @($lines | Where-Object { "$_".Trim() -match "^\d+$" } | Select-Object -Last 1)
                if ($value.Count -ne 1) { throw "Invalid count returned for $table." }
                $parsed = 0L
                if (-not [long]::TryParse("$($value[0])".Trim(), [ref]$parsed)) { throw "Invalid count returned for $table." }
                $backupState.Counts[$table] = $parsed
            }
        } finally {
            Close-SnapshotExporter $exporter
        }
    }
    $dumpHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $outputPath).Hash.ToLowerInvariant()
    $manifestPath = "$outputPath.manifest.json"
    $manifest = New-BackupManifest ([IO.Path]::GetFileName($outputPath)) $dumpHash $connection.Identity $backupState.SnapshotId $backupState.Counts
    $manifestJson = $manifest | ConvertTo-Json -Depth 4
    [IO.File]::WriteAllText($manifestPath, $manifestJson, [Text.UTF8Encoding]::new($false))
    $manifestHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $manifestPath).Hash.ToLowerInvariant()
    Set-Content -LiteralPath "$manifestPath.sha256" -Encoding ASCII -Value $manifestHash
} catch {
    Remove-BackupArtifacts $outputPath
    throw
}
Write-Host "Backup complete: $outputPath"
Write-Host "Integrity manifest complete: $manifestPath"
