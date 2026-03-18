SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('dbo.tbl_band_types', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_band_types (
        id INT IDENTITY(1,1) PRIMARY KEY,
        naam NVARCHAR(160) NOT NULL UNIQUE,
        steek_mm DECIMAL(10,2) NULL,
        dikte_tand_mm DECIMAL(10,2) NULL,
        dikte_band_mm DECIMAL(10,2) NULL,
        wrijvingscoeff_rvs_droog DECIMAL(3,2) NULL,
        wrijvingscoeff_rvs_nat DECIMAL(3,2) NULL,
        actief BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NULL,
        CONSTRAINT CK_tbl_band_types_wrijvingscoeff_rvs_droog CHECK (wrijvingscoeff_rvs_droog IS NULL OR (wrijvingscoeff_rvs_droog >= 0 AND wrijvingscoeff_rvs_droog <= 1)),
        CONSTRAINT CK_tbl_band_types_wrijvingscoeff_rvs_nat CHECK (wrijvingscoeff_rvs_nat IS NULL OR (wrijvingscoeff_rvs_nat >= 0 AND wrijvingscoeff_rvs_nat <= 1))
    );
END
GO
