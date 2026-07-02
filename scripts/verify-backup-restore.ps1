[CmdletBinding()]
param(
    [string]$DumpPath,
    [string]$ManifestPath,
    [switch]$SelfTest
)

$ErrorActionPreference = "Stop"

function Assert-RestoreConfiguration([string]$SourceUrl, [string]$TargetUrl) {
    if ([string]::IsNullOrWhiteSpace($SourceUrl)) { throw "DATABASE_URL is required." }
    if ([string]::IsNullOrWhiteSpace($TargetUrl)) {
        throw "RESTORE_TEST_DATABASE_URL is required and must identify a disposable database."
    }
    if ($SourceUrl.Trim().Equals($TargetUrl.Trim(), [StringComparison]::OrdinalIgnoreCase)) {
        throw "Source and restore target URLs must be distinct."
    }
}

if ($SelfTest) {
    $failures = 0
    function Test-Case([string]$Name, [scriptblock]$Body) {
        try { & $Body; Write-Host "PASS: $Name" }
        catch { $script:failures++; Write-Host "FAIL: $Name - $($_.Exception.Message)" }
    }
    function Assert-Throws([scriptblock]$Body, [string]$MessagePattern) {
        try { & $Body; throw "Expected operation to fail" } catch {
            if ($_.Exception.Message -eq "Expected operation to fail") { throw }
            if ($_.Exception.Message -notlike $MessagePattern) {
                throw "Expected '$MessagePattern', got '$($_.Exception.Message)'"
            }
        }
    }

    Test-Case "restore requires RESTORE_TEST_DATABASE_URL" {
        Assert-Throws { Assert-RestoreConfiguration -SourceUrl "postgresql://source/db" -TargetUrl $null } "*RESTORE_TEST_DATABASE_URL*"
    }
    Test-Case "restore refuses identical source and target URLs" {
        Assert-Throws { Assert-RestoreConfiguration -SourceUrl "postgresql://same/db" -TargetUrl "postgresql://same/db" } "*distinct*"
    }
    Test-Case "restore accepts a distinct disposable target" {
        Assert-RestoreConfiguration -SourceUrl "postgresql://source/db" -TargetUrl "postgresql://disposable/db"
    }
    if ($failures) { exit 1 }
    Write-Host "Self-test passed: restore safety checks"
    exit 0
}

Assert-RestoreConfiguration -SourceUrl $env:DATABASE_URL -TargetUrl $env:RESTORE_TEST_DATABASE_URL
foreach ($tool in @("pg_restore", "psql")) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "$tool was not found on PATH." }
}
if (-not (Test-Path -LiteralPath $DumpPath -PathType Leaf)) { throw "Dump file not found." }
if (-not (Test-Path -LiteralPath $ManifestPath -PathType Leaf)) { throw "Manifest file not found." }

$manifest = (Get-Content -LiteralPath $ManifestPath -Raw).Trim()
if ($manifest -notmatch "^([0-9a-fA-F]{64})\s{2}(.+)$") { throw "Invalid SHA-256 manifest format." }
$expectedHash = $Matches[1].ToLowerInvariant()
$expectedName = $Matches[2]
if ($expectedName -ne [IO.Path]::GetFileName($DumpPath)) { throw "Manifest filename does not match dump." }
$actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $DumpPath).Hash.ToLowerInvariant()
if ($actualHash -ne $expectedHash) { throw "Backup checksum verification failed." }
Write-Host "Checksum verified."

& pg_restore --exit-on-error --clean --if-exists --no-owner --no-acl --dbname $env:RESTORE_TEST_DATABASE_URL $DumpPath
if ($LASTEXITCODE -ne 0) { throw "pg_restore failed with exit code $LASTEXITCODE." }
Write-Host "Restore completed against disposable target."

$tables = @(
    "regulation_sources",
    "raw_regulatory_items",
    "ai_regulatory_updates",
    "news_items",
    "scan_jobs",
    "country_intelligence"
)
foreach ($table in $tables) {
    $query = "select count(*) from public.$table;"
    $sourceCount = (& psql $env:DATABASE_URL --no-psqlrc --tuples-only --no-align --command $query).Trim()
    if ($LASTEXITCODE -ne 0) { throw "Source count query failed for $table." }
    $targetCount = (& psql $env:RESTORE_TEST_DATABASE_URL --no-psqlrc --tuples-only --no-align --command $query).Trim()
    if ($LASTEXITCODE -ne 0) { throw "Target count query failed for $table." }
    if ($sourceCount -ne $targetCount) { throw "Count mismatch for $table (source=$sourceCount target=$targetCount)." }
    Write-Host "Count verified: $table ($targetCount)"
}
Write-Host "Restore verification passed."
