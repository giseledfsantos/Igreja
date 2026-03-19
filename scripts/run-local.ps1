param()
$envFile = Join-Path $PSScriptRoot "..\.env.local"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)\s*=\s*(.*)$') {
      $name = $matches[1].Trim()
      $value = $matches[2].Trim()
      if ($value.StartsWith('"') -and $value.EndsWith('"')) { $value = $value.Trim('"') }
      [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
  }
}
dotnet run
