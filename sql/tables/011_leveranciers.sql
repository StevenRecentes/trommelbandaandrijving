SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('dbo.tbl_leveranciers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_leveranciers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        naam NVARCHAR(120) NOT NULL UNIQUE,
        actief BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NULL
    );

    INSERT INTO dbo.tbl_leveranciers (naam, actief)
    VALUES ('Procon', 1), ('Rulmeca', 1);
END
GO
