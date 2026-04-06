param()
$base = Resolve-Path (Join-Path $PSScriptRoot "..")

$dotnetHome = Join-Path $base ".dotnet_home"
$nugetRoot = Join-Path $base ".nuget"
$nugetPackages = Join-Path $nugetRoot "packages"
$nugetHttpCache = Join-Path $nugetRoot "http-cache"
$nugetPluginsCache = Join-Path $nugetRoot "plugins-cache"

New-Item -ItemType Directory -Force -Path $dotnetHome | Out-Null
New-Item -ItemType Directory -Force -Path $nugetPackages | Out-Null
New-Item -ItemType Directory -Force -Path $nugetHttpCache | Out-Null
New-Item -ItemType Directory -Force -Path $nugetPluginsCache | Out-Null

[Environment]::SetEnvironmentVariable("DOTNET_CLI_HOME", $dotnetHome, 'Process')
[Environment]::SetEnvironmentVariable("NUGET_PACKAGES", $nugetPackages, 'Process')
[Environment]::SetEnvironmentVariable("NUGET_HTTP_CACHE_PATH", $nugetHttpCache, 'Process')
[Environment]::SetEnvironmentVariable("NUGET_PLUGINS_CACHE_PATH", $nugetPluginsCache, 'Process')
[Environment]::SetEnvironmentVariable("DOTNET_SKIP_FIRST_TIME_EXPERIENCE", "1", 'Process')
[Environment]::SetEnvironmentVariable("DOTNET_NOLOGO", "1", 'Process')
[Environment]::SetEnvironmentVariable("ASPNETCORE_URLS", "http://localhost:5090", 'Process')

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
$dotnet = $null
try { $dotnet = (Get-Command dotnet -ErrorAction Stop).Source } catch {}
if (-not $dotnet) { $dotnet = "C:\Program Files\dotnet\dotnet.exe" }
& $dotnet run
