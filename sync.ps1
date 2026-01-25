# Git Sync Script
# This script automates the process of adding, committing, and pushing changes to GitHub.

$message = Read-Host -Prompt 'Enter commit message (default: "Update code")'
if (-not $message) { $message = "Update code" }

Write-Host "Adding changes..." -ForegroundColor Cyan
git add .

Write-Host "Committing changes..." -ForegroundColor Cyan
git commit -m "$message"

Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push origin main

Write-Host "Done! Your code is updated on GitHub." -ForegroundColor Green
pause
