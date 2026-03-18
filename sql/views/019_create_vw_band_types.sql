IF OBJECT_ID('dbo.vw_band_types', 'V') IS NOT NULL
    DROP VIEW dbo.vw_band_types;
GO

CREATE VIEW dbo.vw_band_types
AS
SELECT
    id,
    naam,
    steek_mm,
    dikte_tand_mm,
    dikte_band_mm,
    wrijvingscoeff_rvs_droog,
    wrijvingscoeff_rvs_nat,
    actief,
    created_at,
    updated_at
FROM dbo.tbl_band_types;
GO
