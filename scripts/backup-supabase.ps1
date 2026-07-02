[CmdletBinding()]
param(
    [string]$BackupDirectory,
    [switch]$SelfTest
)

$ErrorActionPreference = "Stop"

function Assert-BackupConfiguration([string]$DatabaseUrl) {
    if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
        throw "DATABASE_URL is required."
    }
}

function Resolve-BackupOutputPath([string]$Directory, [string]$FileName) {
    if ([string]::IsNullOrWhiteSpace($Directory)) {
        throw "An explicit -BackupDirectory is required."
    }
    $root = [IO.Path]::GetFullPath($Directory)
    $leaf = [IO.Path]::GetFileName($FileName)
    if ([string]::IsNullOrWhiteSpace($leaf)) { throw "A backup filename is required." }
    $path = [IO.Path]::GetFullPath((Join-Path $root $leaf))
    if (-not $path.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Backup output must remain under the explicit backup directory."
    }
    return $path
}

function Get-PgDumpArguments([string]$OutputPath, [string]$DatabaseUrl) {
    return @("--format=custom", "--no-owner", "--no-acl", "--file", $OutputPath, $DatabaseUrl)
}

if ($SelfTest) {
    $failures = 0
    function Test-Case([string]$Name, [scriptblock]$Body) {
        try { & $Body; Write-Host "PASS: $Name" }
        catch { $script:failures++; Write-Host "FAIL: $Name - $($_.Exception.Message)" }
    }
    function Assert-Throws([scriptblock]$Body) {
        try { & $Body; throw "Expected operation to fail" } catch {
            if ($_.Exception.Message -eq "Expected operation to fail") { throw }
        }
    }
    function Assert-Equal($Expected, $Actual) {
        if ($Expected -ne $Actual) { throw "Expected '$Expected', got '$Actual'" }
    }

    Test-Case "missing DATABASE_URL fails before external execution" {
        Assert-Throws { Assert-BackupConfiguration -DatabaseUrl $null }
    }
    Test-Case "output path remains inside explicit backup directory" {
        $root = Join-Path ([IO.Path]::GetTempPath()) "backup-self-test"
        $path = Resolve-BackupOutputPath -Directory $root -FileName "..\escape.dump"
        Assert-Equal $true ($path.StartsWith([IO.Path]::GetFullPath($root) + [IO.Path]::DirectorySeparatorChar))
    }
    Test-Case "pg_dump uses required logical backup flags" {
        $args = Get-PgDumpArguments -OutputPath "test.dump" -DatabaseUrl "postgresql://example.invalid/db"
        Assert-Equal "--format=custom --no-owner --no-acl --file test.dump postgresql://example.invalid/db" ($args -join " ")
    }
    if ($failures) { exit 1 }
    Write-Host "Self-test passed: backup safety checks"
    exit 0
}

Assert-BackupConfiguration -DatabaseUrl $env:DATABASE_URL
if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    throw "pg_dump was not found on PATH."
}

$name = "supabase-{0}.dump" -f (Get-Date -Format "yyyyMMdd-HHmmss")
$outputPath = Resolve-BackupOutputPath -Directory $BackupDirectory -FileName $name
$null = New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($outputPath)) -Force

& pg_dump @(Get-PgDumpArguments -OutputPath $outputPath -DatabaseUrl $env:DATABASE_URL)
if ($LASTEXITCODE -ne 0) {
    Remove-Item -LiteralPath $outputPath -Force -ErrorAction SilentlyContinue
    throw "pg_dump failed with exit code $LASTEXITCODE."
}

$hash = Get-FileHash -Algorithm SHA256 -LiteralPath $outputPath
$manifestPath = "$outputPath.sha256"
"{0}  {1}" -f $hash.Hash.ToLowerInvariant(), [IO.Path]::GetFileName($outputPath) |
    Set-Content -LiteralPath $manifestPath -Encoding ascii
if (-not (Test-Path -LiteralPath $manifestPath)) { throw "Checksum manifest creation failed." }

Write-Host "Backup complete: $outputPath"
Write-Host "Manifest complete: $manifestPath"
