# Push changes to GitHub
git add .
$message = $args[0]
if (-not $message) {
    $message = "Update at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
}
git commit -m "$message"
git push
