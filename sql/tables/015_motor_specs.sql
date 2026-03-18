SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('dbo.tbl_motor_specs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_motor_specs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        motortype_id INT NOT NULL FOREIGN KEY REFERENCES dbo.tbl_motortypes(id) ON DELETE CASCADE,
        vermogen_w DECIMAL(12,2) NOT NULL,
        snelheid_ms DECIMAL(10,4) NOT NULL,
        polen INT NULL,
        force_n DECIMAL(12,3) NULL,
        torque_nm DECIMAL(12,3) NULL,
        Aansluiting_type_id INT NULL FOREIGN KEY REFERENCES dbo.tbl_Aansluiting_types(id),
        olie_type NVARCHAR(30) NOT NULL DEFAULT 'onbekend',
        actief BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NULL
    );
END
GO

IF COL_LENGTH('dbo.tbl_motor_specs', 'Aansluiting_type_id') IS NULL
    ALTER TABLE dbo.tbl_motor_specs ADD Aansluiting_type_id INT NULL;
GO

IF COL_LENGTH('dbo.tbl_motor_specs', 'Aansluiting_type_id') IS NOT NULL
   AND NOT EXISTS (
      SELECT 1
      FROM sys.foreign_keys
      WHERE name = 'FK_tbl_motor_specs_Aansluiting_type'
        AND parent_object_id = OBJECT_ID('dbo.tbl_motor_specs')
   )
BEGIN
    ALTER TABLE dbo.tbl_motor_specs WITH CHECK
    ADD CONSTRAINT FK_tbl_motor_specs_Aansluiting_type
      FOREIGN KEY (Aansluiting_type_id) REFERENCES dbo.tbl_Aansluiting_types(id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tbl_motor_specs_motortype_vermogen_snelheid' AND object_id = OBJECT_ID('dbo.tbl_motor_specs'))
    CREATE INDEX IX_tbl_motor_specs_motortype_vermogen_snelheid
    ON dbo.tbl_motor_specs (motortype_id, vermogen_w, snelheid_ms);
GO
