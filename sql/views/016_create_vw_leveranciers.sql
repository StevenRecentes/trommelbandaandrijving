IF OBJECT_ID('dbo.vw_leveranciers', 'V') IS NOT NULL
    DROP VIEW dbo.vw_leveranciers;
GO

CREATE VIEW dbo.vw_leveranciers
AS
SELECT
    id,
    naam,
    actief,
    created_at,
    updated_at
FROM dbo.tbl_leveranciers;
GO
