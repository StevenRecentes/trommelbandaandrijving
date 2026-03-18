IF OBJECT_ID('dbo.vw_motortypes', 'V') IS NOT NULL
    DROP VIEW dbo.vw_motortypes;
GO

CREATE VIEW dbo.vw_motortypes
AS
SELECT
    mt.id,
    mt.leverancier_id,
    l.naam AS leverancier_naam,
    mt.code,
    mt.diameter_nominaal_mm,
    mt.lengte_min_mm,
    mt.lengte_max_mm,
    mt.actief,
    mt.created_at,
    mt.updated_at
FROM dbo.tbl_motortypes mt
INNER JOIN dbo.tbl_leveranciers l ON l.id = mt.leverancier_id;
GO
