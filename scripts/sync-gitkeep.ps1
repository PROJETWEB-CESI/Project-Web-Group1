<#
.SYNOPSIS
    Synchronizes .gitkeep files across the project.
    - Creates .gitkeep in empty folders
    - Removes .gitkeep from folders that now contain other files
#>

Write-Host "Syncing .gitkeep files..." -ForegroundColor Cyan

# 1. Create .gitkeep in empty folders
Get-ChildItem -Directory -Recurse | Where-Object { 
    (Get-ChildItem $_.FullName -Force).Count -eq 0 
} | ForEach-Object {
    $gitkeepPath = Join-Path $_.FullName ".gitkeep"
    if (-not (Test-Path $gitkeepPath)) {
        New-Item -Path $gitkeepPath -ItemType File -Force | Out-Null
        Write-Host "Created  .gitkeep → $($_.FullName)" -ForegroundColor Green
    }
}

# 2. Remove .gitkeep from folders that are no longer empty
Get-ChildItem -Path . -Filter .gitkeep -Recurse -File | ForEach-Object {
    $folder = $_.Directory
    $itemCount = (Get-ChildItem -Path $folder.FullName -Force).Count

    if ($itemCount -gt 1) {
        Remove-Item $_.FullName -Force
        Write-Host "Removed  .gitkeep → $($folder.FullName)" -ForegroundColor Yellow
    }
}

Write-Host "`n.gitkeep synchronization complete." -ForegroundColor Cyan