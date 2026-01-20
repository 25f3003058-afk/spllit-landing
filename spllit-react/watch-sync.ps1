# Git Watch-Sync Script
# This script monitors your files and automatically pushes changes to GitHub every time you save.

Write-Host "Starting Auto-Sync... (Press Ctrl+C to stop)" -ForegroundColor Green

$lastHash = ""

while ($true) {
    # Get a hash of all files in src to detect changes
    $currentHash = Get-ChildItem -Path "src" -Recurse | Get-FileHash | Select-Object -ExpandProperty Hash | Out-String
    
    if ($currentHash -ne $lastHash) {
        if ($lastHash -ne "") {
            Write-Host "Changes detected! Syncing to GitHub..." -ForegroundColor Cyan
            git add .
            git commit -m "Auto-sync: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
            git push origin main
            Write-Host "Sync complete." -ForegroundColor Green
        }
        $lastHash = $currentHash
    }
    
    Start-Sleep -Seconds 5
}
