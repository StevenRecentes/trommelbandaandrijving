import os
from contextlib import contextmanager
from pathlib import Path

import pyodbc


def _load_env():
    root = Path(__file__).resolve().parents[1]
    env_path = root / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        if not line or line.strip().startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip().strip("'").strip('"')
        os.environ[key.strip()] = value


def _build_connection_string(driver):
    server = os.getenv("DB_SERVER", "localhost")
    port = os.getenv("DB_PORT", "1433")
    database = os.getenv("DB_NAME", "")
    user = os.getenv("DB_USER", "")
    password = os.getenv("DB_PASSWORD", "")
    return (
        f"DRIVER={{{driver}}};"
        f"SERVER={server},{port};"
        f"DATABASE={database};"
        f"UID={user};"
        f"PWD={password};"
        "Encrypt=no;"
        "TrustServerCertificate=yes;"
    )


def _candidate_drivers():
    env_driver = os.getenv("DB_DRIVER", "").strip()
    preferred = [
        "ODBC Driver 18 for SQL Server",
        "ODBC Driver 17 for SQL Server",
        "SQL Server",
    ]
    if env_driver:
        preferred.insert(0, env_driver)

    # keep order, remove duplicates
    unique = []
    for item in preferred:
        if item and item not in unique:
            unique.append(item)
    return unique


@contextmanager
def get_db():
    _load_env()
    installed = set(pyodbc.drivers())
    drivers = _candidate_drivers()
    attempted = []
    conn = None
    last_error = None
    for driver in drivers:
        attempted.append(driver)
        if driver not in installed:
            continue
        try:
            conn = pyodbc.connect(_build_connection_string(driver))
            break
        except Exception as exc:
            conn = None
            last_error = exc
            continue

    if conn is None:
        installed_str = ", ".join(sorted(installed)) or "(none)"
        attempted_str = ", ".join(attempted) or "(none)"
        error_str = f" Last error: {last_error}" if last_error else ""
        raise RuntimeError(
            "Database connection failed. "
            f"Tried drivers: {attempted_str}. "
            f"Installed ODBC drivers: {installed_str}. "
            "Set DB_DRIVER in .env to one of the installed SQL Server drivers."
            f"{error_str}"
        )

    try:
        yield conn
    finally:
        conn.close()
