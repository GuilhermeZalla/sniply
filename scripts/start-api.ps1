$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$environmentFile = Join-Path $projectRoot '.env'
if (-not (Test-Path -LiteralPath $environmentFile)) { throw 'Copy .env.example to .env and configure your local secrets first.' }
Get-Content -LiteralPath $environmentFile | ForEach-Object {
    if ($_ -match '^\s*([^#\s=]+)\s*=\s*(.*)$') {
        $variableName = $Matches[1]
        $variableValue = $Matches[2].Trim()
        if (($variableValue.StartsWith('"') -and $variableValue.EndsWith('"')) -or ($variableValue.StartsWith("'") -and $variableValue.EndsWith("'"))) {
            $variableValue = $variableValue.Substring(1, $variableValue.Length - 2)
        }
        [Environment]::SetEnvironmentVariable($variableName, $variableValue, 'Process')
    }
}
$env:ASPNETCORE_ENVIRONMENT = 'Development'
Push-Location $projectRoot
try {
    if ($args -contains '-Migrate') {
        dotnet run --project backend/Sniply.Api --no-launch-profile -- --migrate
    } else {
        dotnet run --project backend/Sniply.Api --no-launch-profile --urls http://127.0.0.1:5088
    }
    if ($LASTEXITCODE -ne 0) { throw 'The API command failed. Review the error above.' }
} finally { Pop-Location }
