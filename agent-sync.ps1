# agent-sync.ps1 - Claude Code <-> Codex coordination ritual (see AGENTS.md "Coordination protocol").
# Run this at the START of a session. It prints the one snapshot both agents need to stay in sync:
#   1) graph freshness (HEAD vs the commit the graph was built from) + auto-offer to refresh
#   2) the AI_TASKS.md status board (who owns what, right now)
#   3) the handoff reminder
# Read-only except for an optional graph refresh you confirm. No app code is touched.

$ErrorActionPreference = 'SilentlyContinue'
$root   = Split-Path -Parent $MyInvocation.MyCommand.Path
$py     = 'C:\Users\coren\AppData\Local\Python\pythoncore-3.14-64\python.exe'
$report = Join-Path $root 'graphify-out\GRAPH_REPORT.md'
$tasks  = Join-Path $root 'AI_TASKS.md'

Write-Host "`n===== AGENT SYNC =====" -ForegroundColor Cyan

# 1) Graph freshness
$head = (& git -C $root rev-parse --short HEAD).Trim()
$built = ''
if (Test-Path $report) {
    $m = Select-String -Path $report -Pattern 'Built from commit:\s*`?([0-9a-f]+)`?' | Select-Object -First 1
    if ($m) { $built = $m.Matches[0].Groups[1].Value }
}
Write-Host "`n[1] Graph freshness" -ForegroundColor Yellow
Write-Host "    HEAD            : $head"
Write-Host "    graph built from: $built"
if (-not $built) {
    Write-Host "    -> No graph found. Build it: py -m graphify extract . --backend <llm>" -ForegroundColor Red
} elseif ($built.StartsWith($head) -or $head.StartsWith($built)) {
    Write-Host "    -> IN SYNC. Safe to query the graph." -ForegroundColor Green
} else {
    Write-Host "    -> STALE. Refreshing AST graph (free, no LLM)..." -ForegroundColor Red
    if (Test-Path $py) {
        & $py -m graphify update $root 2>&1 | Select-Object -Last 3
        & $py -m graphify export obsidian 2>&1 | Select-Object -First 1
        Write-Host "    -> Done. Community names may need a manual relabel after big refactors:" -ForegroundColor DarkYellow
        Write-Host "       py -m graphify cluster-only . --backend openai"
    } else {
        Write-Host "    -> Python not found at $py. Run: py -m graphify update ." -ForegroundColor Red
    }
}

# 2) Status board
Write-Host "`n[2] Status board (AI_TASKS.md)" -ForegroundColor Yellow
if (Test-Path $tasks) {
    $lines = Get-Content $tasks
    $start = ($lines | Select-String -Pattern '^\| Task ID' | Select-Object -First 1).LineNumber
    if ($start) {
        for ($i = $start - 1; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match '^\|') { Write-Host "    $($lines[$i])" } else { break }
        }
    } else { Write-Host "    (no status board found - see AI_TASKS.md)" }
}

# 3) Handoff reminder
Write-Host "`n[3] Before you finish" -ForegroundColor Yellow
Write-Host "    - Update ONLY your own status-board row."
Write-Host "    - Add ONE handoff entry at the top of '## Current status' (format in AI_TASKS.md)."
Write-Host "    - Cite exact graph node/community labels so the other agent can 'explain'/'affected' them."
Write-Host "    - Record verification (test/lint/typecheck/build) or say why it was skipped."
Write-Host "`n======================`n" -ForegroundColor Cyan
