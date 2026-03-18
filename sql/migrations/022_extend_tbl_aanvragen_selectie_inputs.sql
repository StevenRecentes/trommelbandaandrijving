SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH('dbo.tbl_aanvragen', 'soort_transporteur') IS NULL
    ALTER TABLE dbo.tbl_aanvragen ADD soort_transporteur NVARCHAR(80) NULL;
GO

IF COL_LENGTH('dbo.tbl_aanvragen', 'opvoerhoek_graden') IS NULL
    ALTER TABLE dbo.tbl_aanvragen ADD opvoerhoek_graden DECIMAL(10,3) NULL;
GO

IF COL_LENGTH('dbo.tbl_aanvragen', 'opvoerhoogte_m') IS NULL
    ALTER TABLE dbo.tbl_aanvragen ADD opvoerhoogte_m DECIMAL(10,4) NULL;
GO

IF COL_LENGTH('dbo.tbl_aanvragen', 'trommellengte_mm') IS NULL
    ALTER TABLE dbo.tbl_aanvragen ADD trommellengte_mm DECIMAL(10,2) NULL;
GO
