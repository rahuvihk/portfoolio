# =============================================================================
#  open-preview.ps1  —  opens the portfolio in a single dedicated Chrome window
#  and reuses that same window (navigating in-place) on subsequent runs, so
#  you don't end up with a stack of tabs.
#
#  Usage:  powershell -ExecutionPolicy Bypass -File open-preview.ps1  [url]
#  Default url = index.html.
# =============================================================================
param(
  [string]$Url = "file:///C:/Users/kaare/Documents/romi/portfolio/index.html"
)

$ErrorActionPreference = "SilentlyContinue"

$profileDir = Join-Path $env:LOCALAPPDATA "portfolio-preview-chrome"
$port = 9333

function Get-Tabs {
  try {
    return Invoke-RestMethod -Uri "http://127.0.0.1:$port/json" -TimeoutSec 2
  } catch { return $null }
}

$tabs = Get-Tabs
if (-not $tabs) {
  # No debug window running -> launch a fresh one.
  Start-Process chrome -ArgumentList @(
    "--remote-debugging-port=$port",
    "--user-data-dir=`"$profileDir`"",
    "--new-window",
    $Url
  )
  exit 0
}

# Find a "page" tab (not devtools/extensions) and navigate it.
$page = $tabs | Where-Object { $_.type -eq "page" } | Select-Object -First 1
if (-not $page) {
  Start-Process chrome -ArgumentList @(
    "--remote-debugging-port=$port",
    "--user-data-dir=`"$profileDir`"",
    "--new-window",
    $Url
  )
  exit 0
}

# Send Page.navigate via the tab's websocket. PowerShell 5.1 has no native
# websocket client, so use .NET's ClientWebSocket.
Add-Type -AssemblyName System.Net.WebSockets 2>$null
$ws = [System.Net.WebSockets.ClientWebSocket]::new()
$cts = [System.Threading.CancellationTokenSource]::new()
$uri = [Uri]$page.webSocketDebuggerUrl
$null = $ws.ConnectAsync($uri, $cts.Token).GetAwaiter().GetResult()

$msg = @{ id = 1; method = "Page.navigate"; params = @{ url = $Url } } | ConvertTo-Json -Compress
$bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
$buf = [System.ArraySegment[byte]]::new($bytes)
$null = $ws.SendAsync($buf, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).GetAwaiter().GetResult()

Start-Sleep -Milliseconds 200
$null = $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "done", $cts.Token).GetAwaiter().GetResult()

# Bring the Chrome window to the front.
try {
  $chromeProc = Get-Process chrome | Where-Object { $_.MainWindowTitle } | Select-Object -First 1
  if ($chromeProc) {
    Add-Type -TypeDefinition @"
      using System;
      using System.Runtime.InteropServices;
      public class Win {
        [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
      }
"@ 2>$null
    [Win]::SetForegroundWindow($chromeProc.MainWindowHandle) | Out-Null
  }
} catch {}
