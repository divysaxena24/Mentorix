$mainFile = "D:\DIVY\webDev\Projects\Mentorix\mentorix\app\ai-tools\resume-analyzer\ResumeAnalyzerClient.tsx"
$newFuncFile = "D:\DIVY\webDev\Projects\Mentorix\mentorix\temp_new_pdf_function.txt"

# Read the main file
$content = Get-Content $mainFile -Raw

# Read the new function
$newFunc = Get-Content $newFuncFile -Raw

# Find the start of the downloadAnalysisAsPDF function
$startMarker = "const downloadAnalysisAsPDF = async () => {"
$endMarker = "        toast.success(""Downloading premium PDF report..."")"

$startIndex = $content.IndexOf($startMarker)
if ($startIndex -eq -1) { Write-Host "ERROR: Start marker not found"; exit 1 }

# Find the closing brace of the function - look for "    }" followed by blank line then "    return ("
$searchFrom = $startIndex
$braceDepth = 0
$inFunction = $false
for ($i = $startIndex; $i -lt $content.Length; $i++) {
    $ch = $content[$i]
    if (!$inFunction -and $content.Substring($i).StartsWith($startMarker)) {
        $inFunction = $true
        $i += $startMarker.Length - 1
        continue
    }
    if ($inFunction) {
        if ($ch -eq '{') { $braceDepth++ }
        elseif ($ch -eq '}') { 
            $braceDepth--
            if ($braceDepth -eq 0) {
                # Found the closing brace. Check if next non-whitespace is blank line then return
                $endIndex = $i
                break
            }
        }
    }
}

if ($endIndex -eq $null) { Write-Host "ERROR: Function end not found"; exit 1 }

# Build new content
$beforeFunc = $content.Substring(0, $startIndex)
$afterFunc = $content.Substring($endIndex + 1)
$newContent = $beforeFunc + $newFunc.TrimEnd() + "`r`n" + $afterFunc

# Write back
Set-Content -Path $mainFile -Value $newContent -Encoding UTF8 -NoNewline
Write-Host "SUCCESS: Function replaced. File size: " ($newContent.Length) " characters"
