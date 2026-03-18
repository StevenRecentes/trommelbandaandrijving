SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

UPDATE dbo.tbl_band_types
SET wrijvingscoeff_rvs_droog = CASE
    WHEN wrijvingscoeff_rvs_droog < 0 THEN 0
    WHEN wrijvingscoeff_rvs_droog > 1 THEN 1
    ELSE ROUND(wrijvingscoeff_rvs_droog, 2)
END
WHERE wrijvingscoeff_rvs_droog IS NOT NULL;
GO

UPDATE dbo.tbl_band_types
SET wrijvingscoeff_rvs_nat = CASE
    WHEN wrijvingscoeff_rvs_nat < 0 THEN 0
    WHEN wrijvingscoeff_rvs_nat > 1 THEN 1
    ELSE ROUND(wrijvingscoeff_rvs_nat, 2)
END
WHERE wrijvingscoeff_rvs_nat IS NOT NULL;
GO

IF OBJECT_ID('dbo.CK_tbl_band_types_wrijvingscoeff_rvs_droog', 'C') IS NOT NULL
    ALTER TABLE dbo.tbl_band_types DROP CONSTRAINT CK_tbl_band_types_wrijvingscoeff_rvs_droog;
GO

IF OBJECT_ID('dbo.CK_tbl_band_types_wrijvingscoeff_rvs_nat', 'C') IS NOT NULL
    ALTER TABLE dbo.tbl_band_types DROP CONSTRAINT CK_tbl_band_types_wrijvingscoeff_rvs_nat;
GO

ALTER TABLE dbo.tbl_band_types ALTER COLUMN wrijvingscoeff_rvs_droog DECIMAL(3,2) NULL;
GO

ALTER TABLE dbo.tbl_band_types ALTER COLUMN wrijvingscoeff_rvs_nat DECIMAL(3,2) NULL;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_tbl_band_types_wrijvingscoeff_rvs_droog'
      AND parent_object_id = OBJECT_ID('dbo.tbl_band_types')
)
BEGIN
    ALTER TABLE dbo.tbl_band_types WITH CHECK
    ADD CONSTRAINT CK_tbl_band_types_wrijvingscoeff_rvs_droog
    CHECK (wrijvingscoeff_rvs_droog IS NULL OR (wrijvingscoeff_rvs_droog >= 0 AND wrijvingscoeff_rvs_droog <= 1));
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_tbl_band_types_wrijvingscoeff_rvs_nat'
      AND parent_object_id = OBJECT_ID('dbo.tbl_band_types')
)
BEGIN
    ALTER TABLE dbo.tbl_band_types WITH CHECK
    ADD CONSTRAINT CK_tbl_band_types_wrijvingscoeff_rvs_nat
    CHECK (wrijvingscoeff_rvs_nat IS NULL OR (wrijvingscoeff_rvs_nat >= 0 AND wrijvingscoeff_rvs_nat <= 1));
END
GO
