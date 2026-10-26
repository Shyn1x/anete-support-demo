param(
    [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$Release,
    [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{64}$')][string]$RunnerSha256
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$state = Join-Path $env:USERPROFILE 'Lomenti-private\pilot-batch-20261026'
foreach ($required in @('publication.json', '.pilot-live-50-20261026.json', 'demo-passwords.json')) {
    if (-not (Test-Path -LiteralPath (Join-Path $state $required))) { throw 'Required existing batch state is missing. Stop for inspection.' }
}
if ((Test-Path (Join-Path $state '.pilot-zero-request-resume-20261026.json')) -or (Test-Path (Join-Path $state '.live-50.lock'))) { throw 'Continuation already started or another live process is active. Do not retry.' }
$publication = Get-Content -LiteralPath (Join-Path $state 'publication.json') -Raw | ConvertFrom-Json
foreach ($id in @('dzijas','jig','musiclab','etextile','zummers')) {
    if (-not @($publication.events | Where-Object { $_.id -eq $id -and $_.step -eq 'ai-enabled' }).Count) { throw 'A published client was not confirmed in the existing receipt.' }
}
$work = Join-Path $env:USERPROFILE 'Lomenti-pilots-4cdf77d9a70a'
$roots = @(Get-ChildItem -LiteralPath $work -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'package-lock.json') })
if ($roots.Count -ne 1) { throw 'Could not identify the original checked release folder.' }
Set-Location -LiteralPath $roots[0].FullName
$target = Join-Path (Get-Location).Path 'scripts\run-pilot-live.mjs'
if ((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne '7d4015bfc4df3915bebe5748df28883d9b982dd787c5526d82b5fb23af0f654b') { throw 'The local runner changed. Stop for inspection.' }
$temporary = $target + '.client-preflight-fix.tmp'
if (Test-Path -LiteralPath $temporary) { throw 'An earlier download exists. Stop for inspection.' }
Invoke-WebRequest -UseBasicParsing -Uri ('https://raw.githubusercontent.com/Shyn1x/anete-support-demo/' + $Release + '/scripts/run-pilot-live.mjs') -OutFile $temporary
if ((Get-FileHash -LiteralPath $temporary -Algorithm SHA256).Hash -ne $RunnerSha256) { throw 'Runner integrity check failed. No chat request sent.' }
$backup = Join-Path $state 'runner-before-client-preflight-fix.mjs'
if (Test-Path -LiteralPath $backup) { throw 'The runner fix was already applied. Do not repeat it.' }
Copy-Item -LiteralPath $target -Destination $backup
Move-Item -LiteralPath $temporary -Destination $target -Force
& node --check .\scripts\run-pilot-live.mjs
if ($LASTEXITCODE -ne 0) { throw 'Runner syntax check failed. No chat request sent.' }
& node .\scripts\run-pilot-live.mjs --check-zero-request-resume
if ($LASTEXITCODE -ne 0) { throw 'The old report does not prove zero attempted requests. Nothing resumed.' }
$previousAuto = $env:LOMENTI_PILOT_AUTO_CREDENTIALS
try {
    $env:LOMENTI_PILOT_AUTO_CREDENTIALS = '1'
    & node .\scripts\run-pilot-live.mjs --run --allow-paid --max-requests 50 --resume-before-first-request
    if ($LASTEXITCODE -ne 0) { throw 'Live checks stopped. Keep both reports and all markers; do not retry.' }
} finally {
    if ($null -eq $previousAuto) { Remove-Item Env:LOMENTI_PILOT_AUTO_CREDENTIALS -ErrorAction SilentlyContinue } else { $env:LOMENTI_PILOT_AUTO_CREDENTIALS = $previousAuto }
}
