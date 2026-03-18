SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('dbo.tbl_aanvragen', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_aanvragen (
        id INT IDENTITY(1,1) PRIMARY KEY,
        klant_id INT NOT NULL FOREIGN KEY REFERENCES dbo.tbl_klanten(id),
        band_type_id INT NULL FOREIGN KEY REFERENCES dbo.tbl_band_types(id),
        uitvoering_type_id INT NULL FOREIGN KEY REFERENCES dbo.tbl_uitvoering_types(id),
        Aansluiting_type_id INT NULL FOREIGN KEY REFERENCES dbo.tbl_Aansluiting_types(id),
        invoer_vermogen_w DECIMAL(12,2) NULL,
        invoer_snelheid_ms DECIMAL(10,4) NULL,
        olie_voorkeur NVARCHAR(30) NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'concept',
        project_naam NVARCHAR(200) NULL,
        opmerkingen NVARCHAR(MAX) NULL,
        pdf_pad NVARCHAR(500) NULL,
        aangemaakt_op DATETIME2 NOT NULL DEFAULT GETDATE(),
        bijgewerkt_op DATETIME2 NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tbl_aanvragen_klant_datum' AND object_id = OBJECT_ID('dbo.tbl_aanvragen'))
    CREATE INDEX IX_tbl_aanvragen_klant_datum ON dbo.tbl_aanvragen (klant_id, aangemaakt_op DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tbl_aanvragen_status_datum' AND object_id = OBJECT_ID('dbo.tbl_aanvragen'))
    CREATE INDEX IX_tbl_aanvragen_status_datum ON dbo.tbl_aanvragen (status, aangemaakt_op DESC);
GO
