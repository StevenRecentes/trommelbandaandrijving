IF OBJECT_ID('dbo.vw_band_motor_compatibiliteit', 'V') IS NOT NULL
    DROP VIEW dbo.vw_band_motor_compatibiliteit;
GO

CREATE VIEW dbo.vw_band_motor_compatibiliteit
AS
SELECT
    c.id,
    c.band_type_id,
    b.naam AS band_type_naam,
    c.uitvoering_type_id,
    u.naam AS uitvoering_naam,
    c.motortype_id,
    m.code AS motortype_code,
    m.leverancier_id,
    l.naam AS leverancier_naam,
    c.tandenaantal,
    c.pcd_mm,
    c.actief,
    c.created_at,
    c.updated_at
FROM dbo.tbl_band_motor_compatibiliteit c
INNER JOIN dbo.tbl_band_types b ON b.id = c.band_type_id
INNER JOIN dbo.tbl_uitvoering_types u ON u.id = c.uitvoering_type_id
INNER JOIN dbo.tbl_motortypes m ON m.id = c.motortype_id
INNER JOIN dbo.tbl_leveranciers l ON l.id = m.leverancier_id;
GO
