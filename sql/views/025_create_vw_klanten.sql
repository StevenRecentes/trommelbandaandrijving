IF OBJECT_ID('dbo.vw_klanten', 'V') IS NOT NULL
    DROP VIEW dbo.vw_klanten;
GO

CREATE VIEW dbo.vw_klanten
AS
SELECT
    id,
    user_id,
    bedrijfsnaam,
    kvk_nummer,
    contactpersoon_naam,
    email,
    telefoon,
    laatste_status_gezien_op,
    actief,
    created_at,
    updated_at
FROM dbo.tbl_klanten;
GO
