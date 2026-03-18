SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('dbo.tbl_klanten', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_klanten (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NULL UNIQUE FOREIGN KEY REFERENCES dbo.tbl_users(user_id) ON DELETE SET NULL,
        bedrijfsnaam NVARCHAR(200) NULL,
        kvk_nummer NVARCHAR(20) NULL,
        contactpersoon_naam NVARCHAR(200) NULL,
        email NVARCHAR(200) NOT NULL UNIQUE,
        telefoon NVARCHAR(50) NULL,
        laatste_status_gezien_op DATETIME2 NULL,
        actief BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tbl_klanten_email' AND object_id = OBJECT_ID('dbo.tbl_klanten'))
    CREATE INDEX IX_tbl_klanten_email ON dbo.tbl_klanten (email);
GO
