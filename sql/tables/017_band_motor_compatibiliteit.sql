SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('dbo.tbl_band_motor_compatibiliteit', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_band_motor_compatibiliteit (
        id INT IDENTITY(1,1) PRIMARY KEY,
        band_type_id INT NOT NULL FOREIGN KEY REFERENCES dbo.tbl_band_types(id) ON DELETE CASCADE,
        uitvoering_type_id INT NOT NULL FOREIGN KEY REFERENCES dbo.tbl_uitvoering_types(id),
        motortype_id INT NOT NULL FOREIGN KEY REFERENCES dbo.tbl_motortypes(id) ON DELETE CASCADE,
        tandenaantal INT NULL,
        pcd_mm DECIMAL(10,2) NULL,
        actief BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NULL,
        CONSTRAINT UQ_tbl_band_motor_compat UNIQUE (band_type_id, uitvoering_type_id, motortype_id)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tbl_band_motor_compat_filters' AND object_id = OBJECT_ID('dbo.tbl_band_motor_compatibiliteit'))
    CREATE INDEX IX_tbl_band_motor_compat_filters
    ON dbo.tbl_band_motor_compatibiliteit (band_type_id, uitvoering_type_id, motortype_id);
GO
