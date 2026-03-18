SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('dbo.tbl_aanvraag_resultaten', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_aanvraag_resultaten (
        id INT IDENTITY(1,1) PRIMARY KEY,
        aanvraag_id INT NOT NULL FOREIGN KEY REFERENCES dbo.tbl_aanvragen(id) ON DELETE CASCADE,
        motor_spec_id INT NOT NULL FOREIGN KEY REFERENCES dbo.tbl_motor_specs(id),
        netto_snelheid_ms DECIMAL(10,4) NULL,
        ranking_score DECIMAL(10,4) NULL,
        is_geselecteerd BIT NOT NULL DEFAULT 0,
        volgorde INT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tbl_aanvraag_resultaten_aanvraag_score' AND object_id = OBJECT_ID('dbo.tbl_aanvraag_resultaten'))
    CREATE INDEX IX_tbl_aanvraag_resultaten_aanvraag_score
    ON dbo.tbl_aanvraag_resultaten (aanvraag_id, ranking_score DESC);
GO
