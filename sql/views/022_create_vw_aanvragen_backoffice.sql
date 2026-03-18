IF OBJECT_ID('dbo.vw_aanvragen_backoffice', 'V') IS NOT NULL
    DROP VIEW dbo.vw_aanvragen_backoffice;
GO

CREATE VIEW dbo.vw_aanvragen_backoffice
AS
SELECT
    a.id,
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
    k.id AS klant_id,
    k.bedrijfsnaam,
    k.contactpersoon_naam,
    k.email AS klant_email,
    bt.naam AS band_type_naam,
    ut.naam AS uitvoering_naam,
    atp.naam AS Aansluiting_naam,
    SUM(CASE WHEN ar.is_geselecteerd = 1 THEN 1 ELSE 0 END) AS geselecteerde_regels
FROM dbo.tbl_aanvragen a
INNER JOIN dbo.tbl_klanten k ON k.id = a.klant_id
LEFT JOIN dbo.tbl_band_types bt ON bt.id = a.band_type_id
LEFT JOIN dbo.tbl_uitvoering_types ut ON ut.id = a.uitvoering_type_id
LEFT JOIN dbo.tbl_Aansluiting_types atp ON atp.id = a.Aansluiting_type_id
LEFT JOIN dbo.tbl_aanvraag_resultaten ar ON ar.aanvraag_id = a.id
GROUP BY
    a.id, a.status, a.project_naam, a.opmerkingen, a.invoer_vermogen_w, a.invoer_snelheid_ms,
    a.olie_voorkeur, a.soort_transporteur, a.opvoerhoek_graden, a.opvoerhoogte_m, a.trommellengte_mm,
    a.aangemaakt_op, a.bijgewerkt_op,
    k.id, k.bedrijfsnaam, k.contactpersoon_naam, k.email,
    bt.naam, ut.naam, atp.naam;
GO
