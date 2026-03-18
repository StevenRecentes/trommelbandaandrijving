IF OBJECT_ID('dbo.vw_aanvragen_klant', 'V') IS NOT NULL
    DROP VIEW dbo.vw_aanvragen_klant;
GO

CREATE VIEW dbo.vw_aanvragen_klant
AS
SELECT
    a.id,
    a.klant_id,
    a.status,
    a.project_naam,
    a.opmerkingen,
    a.invoer_vermogen_w,
    a.invoer_snelheid_ms,
    a.olie_voorkeur,
    a.soort_transporteur,
    a.opvoerhoek_graden,
    a.opvoerhoogte_m,
    a.trommellengte_mm,
    a.aangemaakt_op,
    a.bijgewerkt_op,
    bt.naam AS band_type_naam,
    ut.naam AS uitvoering_naam,
    atp.naam AS Aansluiting_naam
FROM dbo.tbl_aanvragen a
LEFT JOIN dbo.tbl_band_types bt ON bt.id = a.band_type_id
LEFT JOIN dbo.tbl_uitvoering_types ut ON ut.id = a.uitvoering_type_id
LEFT JOIN dbo.tbl_Aansluiting_types atp ON atp.id = a.Aansluiting_type_id;
GO
