SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('dbo.tbl_motortypes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_motortypes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        leverancier_id INT NOT NULL FOREIGN KEY REFERENCES dbo.tbl_leveranciers(id),
        code NVARCHAR(80) NOT NULL,
        diameter_nominaal_mm DECIMAL(10,2) NULL,
        lengte_min_mm DECIMAL(10,2) NULL,
        lengte_max_mm DECIMAL(10,2) NULL,
        actief BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NULL,
        CONSTRAINT UQ_tbl_motortypes_leverancier_code UNIQUE (leverancier_id, code)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tbl_motortypes_leverancier_code' AND object_id = OBJECT_ID('dbo.tbl_motortypes'))
    CREATE INDEX IX_tbl_motortypes_leverancier_code ON dbo.tbl_motortypes (leverancier_id, code);
GO
