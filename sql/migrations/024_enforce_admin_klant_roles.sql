SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID('dbo.tbl_roles', 'U') IS NULL
    RETURN;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.tbl_roles WHERE LOWER(naam) = 'admin')
    INSERT INTO dbo.tbl_roles (naam, omschrijving, volgorde) VALUES ('Admin', 'Applicatiebeheer', 1);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.tbl_roles WHERE LOWER(naam) = 'klant')
    INSERT INTO dbo.tbl_roles (naam, omschrijving, volgorde) VALUES ('Klant', 'Klantportaal gebruiker', 2);
GO

UPDATE dbo.tbl_users
SET role = CASE
    WHEN LOWER(COALESCE(role, '')) = 'admin' THEN 'Admin'
    ELSE 'Klant'
END
WHERE is_super_admin = 0;
GO

DELETE ur
FROM dbo.tbl_user_roles ur
INNER JOIN dbo.tbl_users u ON u.user_id = ur.user_id
INNER JOIN dbo.tbl_roles r ON r.id = ur.role_id
WHERE u.is_super_admin = 0
  AND LOWER(r.naam) NOT IN ('admin', 'klant');
GO

;WITH role_target AS (
    SELECT
        u.user_id,
        CASE WHEN LOWER(COALESCE(u.role, '')) = 'admin' THEN ra.id ELSE rk.id END AS role_id
    FROM dbo.tbl_users u
    CROSS APPLY (SELECT TOP 1 id FROM dbo.tbl_roles WHERE LOWER(naam) = 'admin' ORDER BY id) ra
    CROSS APPLY (SELECT TOP 1 id FROM dbo.tbl_roles WHERE LOWER(naam) = 'klant' ORDER BY id) rk
    WHERE u.is_super_admin = 0
)
INSERT INTO dbo.tbl_user_roles (user_id, role_id)
SELECT t.user_id, t.role_id
FROM role_target t
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.tbl_user_roles ur
    WHERE ur.user_id = t.user_id AND ur.role_id = t.role_id
);
GO

DELETE rp
FROM dbo.tbl_role_permissions rp
INNER JOIN dbo.tbl_roles r ON r.id = rp.role_id
WHERE LOWER(r.naam) NOT IN ('super admin', 'admin', 'klant');
GO

DELETE ur
FROM dbo.tbl_user_roles ur
INNER JOIN dbo.tbl_roles r ON r.id = ur.role_id
WHERE LOWER(r.naam) NOT IN ('super admin', 'admin', 'klant');
GO

DELETE FROM dbo.tbl_roles
WHERE LOWER(naam) NOT IN ('super admin', 'admin', 'klant');
GO
