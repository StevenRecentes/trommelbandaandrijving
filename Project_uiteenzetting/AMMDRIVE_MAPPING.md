# Ammdrive Data Mapping (Excel -> db_tba)

## Scope
- Bronbestand: `Project_uiteenzetting/Ammdrive overzicht en berekening.xlsx`
- Importscript: `scripts/import_ammdrive.py`
- Doel: reproduceerbare selectie met echte band/motor/compatibiliteitsdata.

## Sheet -> tbl_*/vw_* mapping

### `tech_specs TM`
- `type` -> `tbl_motortypes.code`
- `Fabricaat` -> `tbl_leveranciers.naam` (met canonicalisatie op `Rulmeca`)
- `Dnom` -> `tbl_motortypes.diameter_nominaal_mm`
- `Lmin [mm]` -> `tbl_motortypes.lengte_min_mm` / `tbl_motortypes.lengte_max_mm` (geaggregeerd per type)
- `P [W]` -> `tbl_motor_specs.vermogen_w`
- `Polen` -> `tbl_motor_specs.polen`
- `v [m/s]` -> `tbl_motor_specs.snelheid_ms`
- `F [N]` -> `tbl_motor_specs.force_n`
- `T [Nm]` -> `tbl_motor_specs.torque_nm`

### `Blad1`
- `kolom A (leverancier)` -> `tbl_leveranciers.naam`
- `kolom B (type)` -> `tbl_motortypes.code`
- `kolom C (diameter)` -> `tbl_motortypes.diameter_nominaal_mm`
- `kolom D (vermogen)` -> `tbl_motor_specs.vermogen_w`
- `kolom E (polen)` -> `tbl_motor_specs.polen`
- `kolom F (lengte)` -> `tbl_motortypes.lengte_min_mm` / `lengte_max_mm`
- `kolom G (snelheid)` -> `tbl_motor_specs.snelheid_ms`
- `force_n` en `torque_nm` worden berekend als ze ontbreken:
  - `force_n = vermogen_w / snelheid_ms`
  - `torque_nm = (diameter_nominaal_mm / 2) * (force_n / 1000)`

### `Bandgegevens`
- `Type band` -> `tbl_band_types.naam`
- `Steek [mm]` -> `tbl_band_types.steek_mm`
- `Dikte tand [mm]` -> `tbl_band_types.dikte_tand_mm`
- `Dikte band [mm]` -> `tbl_band_types.dikte_band_mm`
- `Wrijvingscoeff RVS droog` -> `tbl_band_types.wrijvingscoeff_rvs_droog`
- `Wrijvingscoeff RVS nat` -> `tbl_band_types.wrijvingscoeff_rvs_nat`
- Diameterblokken PT87/PT113/PT138 + Z/PCD kolommen ->
  `tbl_band_motor_compatibiliteit`:
  - `tandenaantal`
  - `pcd_mm`
  - combinatie per `band_type_id + uitvoering_type_id + motortype_id`

### `Uitv_tm`
- `T1/T4/T5 ...` regels -> `tbl_Aansluiting_types`
  - `naam`
  - `code`

### `Ammdrive overzicht` en `Selectie`
- Bron voor functionele validatie van uitvoeringsvormen en selectieflow.
- Uitvoeringstypes in DB:
  - `rvs_mantel` -> `RVS mantel met groeven`
  - `sprocket` -> `RVS mantel met spie en sprockets`
  - `bekleding` -> `RVS mantel met gegroefde bekleding`

## Rekenlogica in service-laag
- Bestand: `server/src/services/selectieEngine.js`
- Netto bandsnelheid per kandidaat:
  - `netto_snelheid_ms = (motor_snelheid_ms / diameter_nominaal_mm) * pcd_mm`
- Snelheidsfilter gebruikt `netto_snelheid_ms` i.p.v. ruwe motorsnelheid.
- Ranking gebruikt:
  - snelheidsafwijking (`target` vs `netto`)
  - overcapaciteit (vermogen boven target)
  - optionele leveranciersmatch

## Security en import-controle
- Endpoint: `POST /api/admin/ammdrive-import`
- Guard: `requireAuth` + `requirePermission("/accounts*")`
- Standaard mode: dry-run
- Apply mode vereist expliciet `confirm=IMPORT_AMMDRIVE`
- Workbook path validatie: alleen `Project_uiteenzetting/*.xlsx`
