param(
  [Parameter(Mandatory = $true)]
  [string]$Server,

  [Parameter(Mandatory = $true)]
  [string]$AdminUser,

  [Parameter(Mandatory = $true)]
  [string]$AdminPassword
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Data

$connectionString = "Server=$Server;Database=master;User ID=$AdminUser;Password=$AdminPassword;Encrypt=False;TrustServerCertificate=True;Connection Timeout=30;"
$sql = Get-Content -Raw (Join-Path $PSScriptRoot "..\\sql\\migrations\\021_create_db_tba_and_login.sql")

$batches = $sql -split "(?im)^\s*GO\s*$" | Where-Object { $_.Trim() -ne "" }

$conn = New-Object System.Data.SqlClient.SqlConnection $connectionString
$conn.Open()

foreach ($batch in $batches) {
  $cmd = $conn.CreateCommand()
  $cmd.CommandTimeout = 120
  $cmd.CommandText = $batch
  [void]$cmd.ExecuteNonQuery()
}

$verify = $conn.CreateCommand()
$verify.CommandText = @"
SELECT
  CASE WHEN DB_ID(N'db_tba') IS NOT NULL THEN 1 ELSE 0 END AS db_exists,
  CASE WHEN SUSER_ID(N'log_tba') IS NOT NULL THEN 1 ELSE 0 END AS login_exists;
"@
$r = $verify.ExecuteReader()
$r.Read() | Out-Null
Write-Output ("db_exists={0} login_exists={1}" -f $r["db_exists"], $r["login_exists"])
$r.Close()

$conn.Close()
Write-Output "db_tba + log_tba setup completed."
