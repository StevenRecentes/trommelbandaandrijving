/*
  Creates:
  - database: db_tba
  - login:    log_tba
  - user:     log_tba in db_tba
  - role:     db_owner membership
  - optional: database authorization to log_tba
*/

IF DB_ID(N'db_tba') IS NULL
BEGIN
    CREATE DATABASE [db_tba];
END;
GO

IF SUSER_ID(N'log_tba') IS NULL
BEGIN
    DECLARE @LoginPassword NVARCHAR(256) = NULLIF(N'$(DB_LOGIN_PASSWORD)', N'');
    IF @LoginPassword = N'$(DB_LOGIN_PASSWORD)'
    BEGIN
        SET @LoginPassword = NULL;
    END;

    IF @LoginPassword IS NULL
    BEGIN
        THROW 50001, 'DB_LOGIN_PASSWORD sqlcmd variable ontbreekt. Gebruik bijvoorbeeld: sqlcmd -v DB_LOGIN_PASSWORD=\"<sterk_wachtwoord>\" ...', 1;
    END;

    DECLARE @createLoginSql NVARCHAR(MAX) =
        N'CREATE LOGIN [log_tba] WITH PASSWORD = N''' + REPLACE(@LoginPassword, '''', '''''') + N''', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;';
    EXEC(@createLoginSql);
END;
GO

USE [db_tba];
GO

IF DATABASE_PRINCIPAL_ID(N'log_tba') IS NULL
BEGIN
    CREATE USER [log_tba] FOR LOGIN [log_tba];
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.database_role_members drm
    INNER JOIN sys.database_principals r ON drm.role_principal_id = r.principal_id
    INNER JOIN sys.database_principals m ON drm.member_principal_id = m.principal_id
    WHERE r.name = N'db_owner'
      AND m.name = N'log_tba'
)
BEGIN
    ALTER ROLE [db_owner] ADD MEMBER [log_tba];
END;
GO

BEGIN TRY
    ALTER AUTHORIZATION ON DATABASE::[db_tba] TO [log_tba];
END TRY
BEGIN CATCH
    PRINT 'Authorization not changed (insufficient permissions or policy).';
END CATCH;
GO
