IF OBJECT_ID('dbo.vw_motor_specs', 'V') IS NOT NULL
    DROP VIEW dbo.vw_motor_specs;
GO

CREATE VIEW dbo.vw_motor_specs
AS
SELECT
    ms.id,
    ms.motortype_id,
    mt.code AS motortype_code,
    mt.leverancier_id,
    l.naam AS leverancier_naam,
    mt.diameter_nominaal_mm,
    mt.lengte_min_mm,
    mt.lengte_max_mm,
    ms.Aansluiting_type_id,
    atp.naam AS Aansluiting_naam,
    ms.vermogen_w,
    ms.snelheid_ms,
    ms.polen,
    ms.force_n,
    ms.torque_nm,
    ms.olie_type,
    ms.actief,
    ms.created_at,
    ms.updated_at
FROM dbo.tbl_motor_specs ms
INNER JOIN dbo.tbl_motortypes mt ON mt.id = ms.motortype_id
INNER JOIN dbo.tbl_leveranciers l ON l.id = mt.leverancier_id
LEFT JOIN dbo.tbl_Aansluiting_types atp ON atp.id = ms.Aansluiting_type_id;
GO
