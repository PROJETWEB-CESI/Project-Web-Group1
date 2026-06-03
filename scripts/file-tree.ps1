function CleanTree {
    param([string]$Path = ".")

    $basePath = (Resolve-Path $Path).Path
    $scriptPath = $PSScriptRoot
    $outputFile = Join-Path -Path $scriptPath -ChildPath "file_tree.txt"

    # Start output to file
    "File Tree for: $(Split-Path $basePath -Leaf)" | Out-File -FilePath $outputFile -Encoding utf8

    function Write-Level {
        param($CurrentPath, $Prefix)

        # Get files and folders separately
        $files = Get-ChildItem -Path $CurrentPath -File |
        Where-Object { $_.FullName -notmatch '\\(\.next|node_modules)($|\\)' }

        $folders = Get-ChildItem -Path $CurrentPath -Directory |
        Where-Object { $_.FullName -notmatch '\\(\.next|node_modules)($|\\)' }

        # Print files first
        foreach ($file in $files) {
            "$Prefix+-- $($file.Name)" | Out-File -FilePath $outputFile -Append -Encoding utf8
        }

        # Then print folders
        foreach ($folder in $folders) {
            "$Prefix+-- $($folder.Name)" | Out-File -FilePath $outputFile -Append -Encoding utf8
            $newPrefix = $Prefix + "|   "
            Write-Level -CurrentPath $folder.FullName -Prefix $newPrefix
        }
    }

    Write-Level -CurrentPath $basePath -Prefix ""
}

CleanTree