param(
    [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$Release,
    [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{64}$')][string]$PublisherSha256
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$state = Join-Path $env:USERPROFILE 'Lomenti-private\pilot-batch-20261026'
if ((Test-Path (Join-Path $state 'publication.json')) -or (Test-Path (Join-Path $state '.pilot-live-50-20261026.json'))) { throw 'Publication or live tests already started. Keep markers and reports; do not retry.' }
$work = Join-Path $env:USERPROFILE 'Lomenti-pilots-4cdf77d9a70a'
$roots = @(Get-ChildItem -LiteralPath $work -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'package-lock.json') })
if ($roots.Count -ne 1) { throw 'Could not identify the original checked release folder.' }
Set-Location -LiteralPath $roots[0].FullName
$target = Join-Path (Get-Location).Path 'scripts\publish-pilots.mjs'
if ((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne 'b974c0a5908a44f48f164eb68bee731c84717a4aaa4c8623f21357ba0b2aefcf') { throw 'The local publisher changed. Stop for inspection.' }
$temporary = $target + '.auth-fix.tmp'
if (Test-Path -LiteralPath $temporary) { throw 'An earlier fix download exists. Stop for inspection.' }
Invoke-WebRequest -UseBasicParsing -Uri ('https://raw.githubusercontent.com/Shyn1x/anete-support-demo/' + $Release + '/scripts/publish-pilots.mjs') -OutFile $temporary
if ((Get-FileHash -LiteralPath $temporary -Algorithm SHA256).Hash -ne $PublisherSha256) { throw 'Publisher integrity check failed. Nothing published.' }
$backup = Join-Path $state 'publisher-before-auth-fix.mjs'
if (Test-Path -LiteralPath $backup) { throw 'The auth fix has already been applied. Do not repeat it.' }
Copy-Item -LiteralPath $target -Destination $backup
Move-Item -LiteralPath $temporary -Destination $target -Force
& node --check .\scripts\publish-pilots.mjs
if ($LASTEXITCODE -ne 0) { throw 'Publisher syntax check failed. Nothing published.' }
$secureKey = $null
$keyPointer = [IntPtr]::Zero
$previousKey = $env:OPENAI_API_KEY
try {
    if ([string]::IsNullOrWhiteSpace($previousKey)) {
        $secureKey = Read-Host 'Existing OpenAI API key' -AsSecureString
        $keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
        $env:OPENAI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer)
    }
    & node .\scripts\publish-pilots.mjs --publish-and-test
    if ($LASTEXITCODE -ne 0) { throw 'Publication or live tests stopped. Preserve state and do not rerun.' }
} finally {
    if ($keyPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer) }
    if ($null -ne $secureKey) { $secureKey.Dispose() }
    if ($null -eq $previousKey) { Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue } else { $env:OPENAI_API_KEY = $previousKey }
}
