IF OBJECT_ID('dbo.vw_Aansluiting_types', 'V') IS NOT NULL
    DROP VIEW dbo.vw_Aansluiting_types;
GO

CREATE VIEW dbo.vw_Aansluiting_types
AS
SELECT
    id,
    naam,
    code,
    actief,
    created_at,
    updated_at
FROM dbo.tbl_Aansluiting_types;
GO
