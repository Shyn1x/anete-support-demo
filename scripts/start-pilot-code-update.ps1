param([Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$Release)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$nodeMajor = [int]((& node -p 'parseInt(process.versions.node)') | Select-Object -Last 1)
if ($LASTEXITCODE -ne 0 -or $nodeMajor -lt 22) { throw 'Node.js 22 or newer is required.' }
$state = Join-Path $env:USERPROFILE 'Lomenti-private\pilot-batch-20261026'
if (-not (Test-Path (Join-Path $state 'publication.json'))) { throw 'Original publication receipt missing.' }
if (-not (Test-Path (Join-Path $state 'pilot-code-update-20261027.json'))) { throw 'Previous v2 update receipt missing.' }
if (Test-Path (Join-Path $state 'pilot-code-update-comparison-v3.json')) { throw 'An update already started. Keep the receipt and inspect it.' }
$work = Join-Path $env:USERPROFILE ('Lomenti-pilot-update-' + $Release.Substring(0,12))
if (Test-Path -LiteralPath $work) { throw 'This release folder already exists. Inspect it before retrying.' }
New-Item -ItemType Directory -Path $work | Out-Null
$archive = Join-Path $work 'release.zip'
Invoke-WebRequest -UseBasicParsing -Uri ('https://api.github.com/repos/Shyn1x/anete-support-demo/zipball/' + $Release) -Headers @{'User-Agent'='Lomenti-pilot-update'} -OutFile $archive
Expand-Archive -LiteralPath $archive -DestinationPath $work
$roots = @(Get-ChildItem -LiteralPath $work -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'package-lock.json') })
if ($roots.Count -ne 1) { throw 'Unexpected release structure.' }
Set-Location -LiteralPath $roots[0].FullName
& npm.cmd ci --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'Dependencies failed. Nothing deployed.' }
& npm.cmd test
if ($LASTEXITCODE -ne 0) { throw 'Local tests failed. Nothing deployed.' }
& npm.cmd run test:worker
if ($LASTEXITCODE -ne 0) { throw 'Worker tests failed. Nothing deployed.' }
& node .\scripts\update-pilot-code.mjs --update-code-only
if ($LASTEXITCODE -ne 0) { throw 'Update stopped. Preserve receipts and do not retry blindly.' }
