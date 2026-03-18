SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH('dbo.tbl_klanten', 'laatste_status_gezien_op') IS NULL
    ALTER TABLE dbo.tbl_klanten ADD laatste_status_gezien_op DATETIME2 NULL;
GO
