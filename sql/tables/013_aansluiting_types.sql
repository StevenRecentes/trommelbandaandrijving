SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('dbo.tbl_Aansluiting_types', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_Aansluiting_types (
        id INT IDENTITY(1,1) PRIMARY KEY,
        naam NVARCHAR(120) NOT NULL UNIQUE,
        code NVARCHAR(40) NULL,
        actief BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NULL
    );

    INSERT INTO dbo.tbl_Aansluiting_types (naam, code, actief)
    VALUES
        ('T1 Rechte wartel', 'T1', 1),
        ('T4 klemmenkast RVS', 'T4', 1),
        ('T5 Haakse wartel RVS', 'T5', 1);
END
GO
