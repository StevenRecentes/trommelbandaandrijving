SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
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
