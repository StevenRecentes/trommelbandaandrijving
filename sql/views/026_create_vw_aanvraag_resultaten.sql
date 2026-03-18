IF OBJECT_ID('dbo.vw_aanvraag_resultaten', 'V') IS NOT NULL
    DROP VIEW dbo.vw_aanvraag_resultaten;
GO

CREATE VIEW dbo.vw_aanvraag_resultaten
AS
SELECT
    ar.id,
    ar.aanvraag_id,
    ar.motor_spec_id,
    ar.netto_snelheid_ms,
    ar.ranking_score,
    ar.is_geselecteerd,
    ar.volgorde,
    ar.created_at,
    ms.motortype_code,
    ms.leverancier_naam,
    ms.vermogen_w,
    ms.snelheid_ms,
    ms.olie_type
FROM dbo.tbl_aanvraag_resultaten ar
INNER JOIN dbo.vw_motor_specs ms ON ms.id = ar.motor_spec_id;
GO
