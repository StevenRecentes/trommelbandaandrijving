IF OBJECT_ID('dbo.vw_uitvoering_types', 'V') IS NOT NULL
    DROP VIEW dbo.vw_uitvoering_types;
GO

CREATE VIEW dbo.vw_uitvoering_types
AS
SELECT
    id,
    naam,
    code,
    actief,
    created_at,
    updated_at
FROM dbo.tbl_uitvoering_types;
GO
