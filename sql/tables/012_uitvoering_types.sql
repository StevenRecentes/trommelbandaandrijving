SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('dbo.tbl_uitvoering_types', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_uitvoering_types (
        id INT IDENTITY(1,1) PRIMARY KEY,
        naam NVARCHAR(120) NOT NULL UNIQUE,
        code NVARCHAR(40) NULL,
        actief BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NULL
    );

    INSERT INTO dbo.tbl_uitvoering_types (naam, code, actief)
    VALUES
        ('RVS mantel met groeven', 'rvs_mantel', 1),
        ('RVS mantel met spie en sprockets', 'sprocket', 1),
        ('RVS mantel met gegroefde bekleding', 'bekleding', 1);
END
GO
