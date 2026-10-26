param([Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$Release)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 22 or newer is required.' }
$nodeMajor = [int]((& node -p 'parseInt(process.versions.node)') | Select-Object -Last 1)
if ($LASTEXITCODE -ne 0 -or $nodeMajor -lt 22) { throw 'Node.js 22 or newer is required.' }
$state = Join-Path $env:USERPROFILE 'Lomenti-private\pilot-batch-20261026'
if ((Test-Path (Join-Path $state 'publication.json')) -or (Test-Path (Join-Path $state '.pilot-live-50-20261026.json'))) { throw 'This batch has already started. Keep the reports and do not repeat it.' }
New-Item -ItemType Directory -Path $state -Force | Out-Null
$identity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
& icacls.exe $state /inheritance:r /grant:r "${identity}:(OI)(CI)F" | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not restrict access to the local private folder.' }
$work = Join-Path $env:USERPROFILE ('Lomenti-pilots-' + $Release.Substring(0,12))
if (Test-Path $work) { throw 'The release folder already exists. Do not repeat the bootstrap; inspect it first.' }
New-Item -ItemType Directory -Path $work | Out-Null
Write-Host 'Downloading the pinned GitHub release into a NEW folder. Existing project files stay untouched.'
$archive = Join-Path $work 'release.zip'
Invoke-WebRequest -UseBasicParsing -Uri ('https://api.github.com/repos/Shyn1x/anete-support-demo/zipball/' + $Release) -Headers @{'User-Agent'='Lomenti-pilot-bootstrap'} -OutFile $archive
Expand-Archive -LiteralPath $archive -DestinationPath $work
$roots = @(Get-ChildItem -LiteralPath $work -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'package-lock.json') })
if ($roots.Count -ne 1) { throw 'Unexpected release archive structure.' }
Set-Location -LiteralPath $roots[0].FullName
& npm.cmd ci --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed. Nothing published.' }
& npm.cmd test
if ($LASTEXITCODE -ne 0) { throw 'Local tests failed. Nothing published.' }
& npm.cmd run test:worker
if ($LASTEXITCODE -ne 0) { throw 'Worker tests failed. Nothing published.' }
$secureKey = $null
$keyPointer = [IntPtr]::Zero
$previousKey = $env:OPENAI_API_KEY
try {
    if ([string]::IsNullOrWhiteSpace($previousKey)) {
        Write-Host 'Paste the EXISTING OpenAI project key at the hidden prompt. Do not create or delete a key.'
        $secureKey = Read-Host 'Existing OpenAI API key' -AsSecureString
        $keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
        $env:OPENAI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer)
    }
    & node .\scripts\publish-pilots.mjs --publish-and-test
    if ($LASTEXITCODE -ne 0) { throw 'Publication or live tests stopped. Keep the local state; do not rerun the command.' }
} finally {
    if ($keyPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer) }
    if ($null -ne $secureKey) { $secureKey.Dispose() }
    if ($null -eq $previousKey) { Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue } else { $env:OPENAI_API_KEY = $previousKey }
}
Write-Host ('Done. Private passwords and reports: ' + $state)
