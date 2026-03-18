# BOUWPLAN — Trommelmotor Selectietool

> Gegenereerd: 2026-03-17  
> Rol: Prompt Engineer  
> Bronnen: `Project_uiteenzetting/Kennismaken-ba9ff967-323e.docx`, `Project_uiteenzetting/Uitwerking..xlsx`

---

## Projectsamenvatting

TBA is een handelsbedrijf in trommelmotor-aandrijvingen (merken: **Procon** en **Romeca**). Klanten (engineers/technici van bedrijven) moeten een trommelmotor kunnen selecteren op basis van hun transportbandspecificaties. Het systeem genereert vervolgens een selectie-advies als PDF en stuurt dat als offerte-aanvraag naar TBA.

Het eindproduct bestaat uit twee gescheiden portalen op één domein (bijv. `trommel.nl`):

| Portaal | Wie | Primaire actie |
|---|---|---|
| **Klantenportaal** | Klanten (technici van bedrijven) | Registreren, inloggen, aanvraag indienen, historie |
| **Backoffice** | TBA-medewerkers (admin) | Motordata beheren, aanvragen bekijken, klantbeheer |

---

## Architectuuroverzicht

```
trommel.nl/klantenportaal/   ← React SPA, klantroutes
trommel.nl/backoffice/        ← React SPA, admin routes (huidige template)

API:  /api/* (Express)  ←  beveiligd met requireAuth + requirePermission
DB:   MSSQL
      tbl_*  →  schrijven
      vw_*   →  lezen (API-laag)
```

---

## Fasering

```
Fase 0  →  Data fundament (motor- & bandgegevens backoffice)
Fase 1  →  Klantenportaal: registratie + login + KVK-verificatie
Fase 2  →  Aanvraag-wizard + selectie-algoritme + PDF + e-mail
Fase 3  →  Aanvragen-beheer backoffice
Fase 4  →  Vermogenscalculator (stap 2 — toekomst)
```

---

## Fase 0 — Data fundament

### Opdracht
Bouw de volledige datalaag en backoffice-beheerpagina's voor **motors**, **banden** en **leveranciers**. Dit is het hart van het selectie-algoritme: zonder correcte data werkt niets.

### Context
Het bestand `Ammdrive overzicht en berekening.xlsx` is de **gezaghebbende databron** voor fase 0. Het bevat vijf relevante sheets:

**Sheet `tech_specs TM`** — één rij per motor-spec-combinatie:

| Kolom | Inhoud | Voorbeeld |
|---|---|---|
| A `type` | Motortype naam | PT86X Beta, PT87X Beta, PT113X Beta, PT113X2 Beta, PT138X Beta, PT138X2 Beta |
| B `Fabricaat` | Leverancier | Procon, Rulmeca |
| C `Dnom` | Nominale diameter (mm) | 87, 113, 138 |
| D `P [W]` | Vermogen (Watt) | 30, 55, 65, 80, 100, 200, 300, 750… |
| E `Polen` | Aantal motorpolen | 2, 4, 6, 8 |
| F `v [m/s]` | Nominate snelheid | 0.065, 0.08, 0.1, 0.125, 0.16, 0.2… |
| J `Lmin [mm]` | Minimum bandlengte | 200, 250, 260, 320… |
| Q `Nummer` | Catalogusnummer | 1 t/m ~200 |

Rulmeca-modellen: `TM080LS`, `TM080LS DER`, `TM113LS`, `TM113LS DER`, `TM138LS`, `TM138LS DER`, `TM165LS`  
Procon-modellen: `PT86X Beta`, `PT87X Beta`, `PT113X Beta`, `PT113X2 Beta`, `PT138X Beta`, `PT138X2 Beta`

**Sheet `Bandgegevens`** — één rij per bandtype:

| Kolom | Inhoud |
|---|---|
| C `Type band` | Bandnaam (Soliflex Center bar, Soliflex Pro mini 1,5 / 2,0, Soliflex Pro 2,0 / 3,0 / 4,0, Soliflex Full Bar mini, Soliflex Full Bar) |
| D `Steek [mm]` | Tandsteek in mm |
| E `Dikte tand [mm]` | Tanddikte |
| F `Dikte band [mm]` | Banddikte |
| G-I | Wrijvingscoëfficiënten (RVS droog/nat, HDPE droog/nat) |
| K-AF | Per motortype (PT87 / PT113 / PT138): RVS_Z, Sprocket_Z, Bekleding_Z, RVS_PCD, Sprocket_PCD, Bekleding_PCD |

**Snelheidsberekening (selectie-algoritme):**
```
v_netto = v_nominaal * (PCD_aandrijving / Dnom)
```
Waarbij `PCD_aandrijving` de pitch circle diameter is uit de compatibiliteitstabel voor de gekozen combinatie (bandtype × motortype × aandrijvingstype).

**Sheet `Uitv_tm`** — aansluitopties per motor:
- T1 Rechte wartel
- T4 Klemmenkast RVS
- T5 Haakse wartel RVS

**Seed-data beschikbaar:** alle motor-specs en bandgegevens kunnen direct uit dit Excel-bestand worden geseeded via een Python-script in `sql/data/`.

### Per rol

#### Architect
- Houd de backoffice-beheerpagina's in `client/src/pages/` als aparte feature-mappen: `Motors/`, `Banden/`, `Leveranciers/`.
- Motordata is de meest-gelezen tabel in het systeem → indexeer op `(leverancier_id, motortype_id, vermogen)`.
- Gebruik `ClientTable` voor alle lijstpagina's; geen custom table-implementaties.
- Zorg dat `server/src/routes/` de feature-structuur volgt: `motors.js`, `banden.js`, `leveranciers.js`.

#### Builder
**Database (Data-engineer levert SQL, Builder integreert):**
- Tabellen: `tbl_leveranciers`, `tbl_motortypes`, `tbl_motor_specs`, `tbl_band_types`, `tbl_band_motor_compatibiliteit`
- Views: `vw_motor_specs` (join leverancier + motortype + spec), `vw_band_types`, `vw_band_motor_compatibiliteit`

**Express API:**
```
GET    /api/leveranciers
GET    /api/motortypes
GET    /api/motor-specs          ?leverancier&motortype&vermogen (gefilterd)
POST   /api/motor-specs
PUT    /api/motor-specs/:id
DELETE /api/motor-specs/:id

GET    /api/band-types
POST   /api/band-types
PUT    /api/band-types/:id
DELETE /api/band-types/:id

GET    /api/band-motor-compatibiliteit
POST/PUT/DELETE /api/band-motor-compatibiliteit/:id
```
- Alle endpoints: `requireAuth` + `requirePermission("/gegevens*")`
- Schrijf via tabellen, lees via views

**React Backoffice pagina's:**
- `/backoffice/gegevens/motors` → `ClientTable` + modaal voor add/edit
- `/backoffice/gegevens/banden` → idem
- `/backoffice/gegevens/leveranciers` → idem
- Navigatie-entry in `App.jsx` onder sidebar-sectie "Gegevens"

#### Tester
Playwright-scenario's:
1. Admin logt in → navigeert naar Motors → ziet lijst
2. Admin voegt motor-spec toe → spec verschijnt in lijst
3. Admin bewerkt spec → wijziging zichtbaar
4. Admin verwijdert spec → spec verdwijnt
5. Niet-admin gebruiker → `/gegevens/*` geeft 403
6. Lege tabel: toon lege state (geen foutmelding)

#### Designer
- Gebruik bestaande `ClientTable`-patronen; geen afwijkende stijl
- Modale formulieren: bestaand modal-patroon uit `Stamgegevens.jsx`
- Leverancier badge/chip (Procon = blauw, Romeca = groen) als visueel hulpmiddel — via CSS-variabele, niet hardcoded kleur

#### Data-engineer
Tabelstructuur (direct afgeleid van `Ammdrive overzicht en berekening.xlsx`):

```sql
-- tbl_leveranciers
id, naam (Procon | Rulmeca), actief BIT, created_at, updated_at

-- tbl_motortypes
id, leverancier_id FK, code NVARCHAR(30) -- bijv. 'PT87X Beta', 'TM113LS'
dnom_mm INT,           -- nominale diameter (kolom C)
lmin_mm INT,           -- minimum bandlengte (kolom J)
heeft_olie BIT,        -- PT86 = olievrij; rest = olie
beschrijving NVARCHAR(200), actief BIT

-- tbl_motor_specs
id, motortype_id FK,
vermogen_w INT,        -- kolom D (P [W])
polen INT,             -- kolom E
snelheid_ms DECIMAL(8,4),  -- kolom F (v [m/s]) — nominale waarde
catalogus_nr INT,      -- kolom Q (Nummer)
created_at, updated_at
INDEX: (motortype_id, vermogen_w, snelheid_ms)

-- tbl_aansluit_opties  (uit sheet Uitv_tm)
id, motortype_id FK,
code NVARCHAR(10),     -- bijv. 'T1', 'T4', 'T5'
omschrijving NVARCHAR(100)

-- tbl_band_types  (uit sheet Bandgegevens, kolom C)
id, naam NVARCHAR(100),  -- bijv. 'Soliflex Pro mini 1,5'
steek_mm DECIMAL(6,2),   -- kolom D
dikte_tand_mm DECIMAL(6,2),
dikte_band_mm DECIMAL(6,2),
wrijving_rvs_droog DECIMAL(4,3),
wrijving_rvs_nat DECIMAL(4,3),
wrijving_hdpe_droog DECIMAL(4,3),
wrijving_hdpe_nat DECIMAL(4,3),
actief BIT

-- tbl_band_motor_compatibiliteit  (uit Bandgegevens kolommen K-AF)
id, band_type_id FK, motortype_id FK,
aandrijving_type NVARCHAR(20),   -- 'rvs_mantel' | 'sprocket' | 'bekleding'
tandenaantal INT NULL,           -- Z (tanden)
pcd_mm DECIMAL(8,3),             -- PCD (pitch circle diameter in mm)
beschikbaar BIT DEFAULT 1
```

**Seed-script:** `sql/data/05_ammdrive_seed.py` — leest `Ammdrive overzicht en berekening.xlsx` en genereert INSERT-statements voor alle bovenstaande tabellen.

**Snelheidsberekening in selectie-service:**
```js
// server/src/services/selectie.js
const v_netto = spec.snelheid_ms * (compat.pcd_mm / motortype.dnom_mm);
```

#### Cyber-security
- `tbl_motor_specs` is leesbaar voor klanten (fase 2), maar **schrijfbaar alleen voor admins**. Controleer `requirePermission` op de schrijf-endpoints.
- Alle IDs zijn integers (geen UUIDs nodig), maar valideer dat ze numeriek zijn vóór gebruik in queries.
- Geen `SELECT *` in views — kolommen expliciet benoemen.

### Acceptatiecriteria
- [ ] Motor-specs CRUD werkt volledig via backoffice UI
- [ ] Band-types CRUD werkt volledig via backoffice UI
- [ ] Niet-admin kan geen schrijfacties uitvoeren (API geeft 403)
- [ ] Views geven correcte gefilterde data terug op vermogen + leverancier
- [ ] Bestandsgroottes blijven onder 500 regels

---

## Fase 1 — Klantenportaal: registratie, login & KVK

### Opdracht
Bouw een volledig gescheiden klantenportaal (`/klantenportaal`) met eigen login, registratieflow met KVK-verificatie via het Handelsregister API, en klantprofiel.

### Context
- Klanten zijn engineers/technici bij bedrijven (nooit particulieren)
- KVK-nummer is verplicht als drempel voor serieuze aanvragen
- Klanten mogen eerder ingediende aanvragen terugzien
- De backoffice-auth (sessie + rollen) blijft intact en gescheiden

### Per rol

#### Architect
- Klantenportaal krijgt eigen route-prefix `/klantenportaal/*` in React Router
- Klant-sessies lopen via dezelfde Express-sessiemiddleware maar met eigen rol `klant`
- Klant-API-endpoints onder `/api/klant/*` (gescheiden prefix van `/api/*` admins)
- Klantgegevens in eigen tabel `tbl_klanten` — **niet** in `tbl_users` (andere structuur, andere rol)
- Klantenportaal-pagina's in `client/src/pages/klantenportaal/`

#### Builder
**Database:** `tbl_klanten` (id, bedrijfsnaam, kvk_nummer, kvk_verified BIT, contactpersoon_naam, email, telefoon, created_at, updated_at), klant-sessie via bestaande Express-sessie met `klant_id`

**Express API:**
```
POST /api/klant/registreer      ← bedrijfsnaam, kvk_nummer, naam, email, wachtwoord
POST /api/klant/login
POST /api/klant/logout
GET  /api/klant/profiel         requireKlantAuth
PUT  /api/klant/profiel         requireKlantAuth
GET  /api/klant/kvk-zoek?q=     ← proxy naar KVK Handelsregister API (server-side)
```

**React klantenportaal:**
- `/klantenportaal/login` — inlogformulier
- `/klantenportaal/registreer` — stap 1: bedrijf zoeken via KVK, stap 2: account-gegevens
- `/klantenportaal/profiel` — gegevens inzien/wijzigen
- `/klantenportaal/aanvragen` — historieoverzicht (fase 2 vult dit)

#### Tester
Playwright-scenario's:
1. Nieuwe klant registreert: KVK zoeken → bedrijf selecteren → gegevens invullen → account aangemaakt
2. Klant logt in → komt op portaal-home
3. Foutief wachtwoord → foutmelding zonder accountgegevens te lekken
4. Klant probeert backoffice-route → redirect naar klantenportaal-login
5. Admin probeert klant-route → redirect (of 403)
6. KVK-zoekresultaat toont correct bedrijfsnaam + vestigingsadres

#### Designer
- Klantenportaal heeft eigen visuele identiteit: TBA-huisstijl (neutraal, professioneel, industrieel)
- Registratiewizard: duidelijke stap-indicatie (stap 1/2) bovenaan
- KVK-zoekveld: live autocomplete-dropdown terwijl klant typt
- Mobiel-responsive: klanten gebruiken dit ook op tablet/telefoon
- Geen sidebar; klantenportaal heeft topnavigatie

#### Data-engineer
```sql
tbl_klanten:
  id             INT IDENTITY PRIMARY KEY
  bedrijfsnaam   NVARCHAR(200) NOT NULL
  kvk_nummer     CHAR(8) UNIQUE NOT NULL
  kvk_verified   BIT DEFAULT 0
  contactpersoon_naam NVARCHAR(200)
  email          NVARCHAR(200) UNIQUE NOT NULL
  wachtwoord_hash NVARCHAR(500) NOT NULL
  telefoon       NVARCHAR(30)
  created_at     DATETIME2 DEFAULT GETDATE()
  updated_at     DATETIME2

INDEX op (kvk_nummer), (email)
```

View `vw_klanten` met alle publieke velden (zonder `wachtwoord_hash`).

#### Cyber-security
- KVK API-aanroep gebeurt **server-side** (SSRF-risico: valideer dat de URL naar `api.kvk.nl` gaat, niet door gebruiker instelbaar)
- KVK API-key staat in `.env`, nooit in client-code
- Wachtwoord hash via `scrypt` (conform bestaand patroon in `server/src/auth.js`)
- Rate-limit op `/api/klant/login`: max 10 pogingen per IP per 15 minuten
- `tbl_klanten` is nooit leesbaar via backoffice zonder expliciet klantbeheer-endpoint met eigen permission
- Klant-sessie mag nooit admin-rechten hebben — controleer rol bij elke `requireKlantAuth`

### Acceptatiecriteria
- [ ] Registratieflow voltooid met KVK-verificatie
- [ ] Login/logout werkt; sessie verloopt na inactiviteit
- [ ] Klant kan profiel inzien en wijzigen
- [ ] Klant kan geen backoffice-routes bereiken
- [ ] Admin kan geen klantenportaal-routes zien als klant
- [ ] KVK-zoek werkt server-side via `.env`-geconfigureerde API-key

---

## Fase 2 — Aanvraag-wizard + selectie-algoritme + PDF + e-mail

### Opdracht
Bouw de kern van de applicatie: een **3-stap wizard** in het klantenportaal waarmee een klant een trommelmotor selecteert. Het algoritme filtert de motordata op basis van invoer. Het resultaat wordt als PDF gegenereerd en per e-mail naar TBA én de klant gestuurd.

### Context — selectie-logica

```
Invoer klant:
  1. Bandtype (selecteer uit tbl_band_types)
  2. Aandrijvings-type (rvs_mantel / sprocket / bekleding)
  3. Benodigd vermogen (Watt)
  4. Gewenste snelheid (m/s)
  5. Voorkeur: wel/geen olie (optioneel)

Algoritme (server/src/services/selectie.js):
  → Filter tbl_motor_specs op:
       vermogen_w >= invoer.vermogen
  → Join tbl_band_motor_compatibiliteit:
       band_type_id = invoer.band_type_id
       aandrijving_type = invoer.aandrijving_type
       beschikbaar = 1
  → Bereken netto snelheid per combinatie:
       v_netto = spec.snelheid_ms * (compat.pcd_mm / motortype.dnom_mm)
  → Filter op snelheid: v_netto ≈ invoer.snelheid (tolerantie ± 10%)
  → (optioneel) filter op motortype.heeft_olie = voorkeur
  → Sorteer: kleinste vermogen eerst, bij gelijk vermogen: kleinste diameter

Output per resultaat:
  motortype_code, fabricaat, dnom_mm, vermogen_w, snelheid_nominaal_ms,
  v_netto_ms, aandrijving_type, pcd_mm, tandenaantal, lmin_mm
```

### Per rol

#### Architect
- Wizard-logica in `client/src/pages/klantenportaal/Aanvraag/` (eigen subfolder met stap-componenten)
- Selectie-algoritme in aparte server-service: `server/src/services/selectie.js`
- PDF-generatie als eigen service: `server/src/services/pdf.js` (gebruik `pdfkit` of `puppeteer`)
- E-mailverzending: `server/src/services/mail.js` (gebruik `nodemailer`)
- Aanvragen opslaan in `tbl_aanvragen` + `tbl_aanvraag_resultaten`
- Wizard-state: bewaar per stap in React state (niet in URL, want gevoelig)

#### Builder
**Express API:**
```
POST /api/klant/aanvragen                    requireKlantAuth
  body: { band_type_id, aandrijving_type, vermogen_w, snelheid_ms, heeft_olie_voorkeur }
  returns: { aanvraag_id, resultaten: [...motors] }

GET  /api/klant/aanvragen                    requireKlantAuth
GET  /api/klant/aanvragen/:id                requireKlantAuth
POST /api/klant/aanvragen/:id/bevestig       requireKlantAuth
  → genereert PDF, stuurt e-mail naar TBA + klant
```

**React wizard-componenten:**
- `Stap1_Bandtype.jsx` — dropdown bandtype + aandrijvingstype (rvs_mantel / sprocket / bekleding)
- `Stap2_Parameters.jsx` — vermogen (Watt), gewenste snelheid (m/s), olie-voorkeur (radio: ja / nee / geen voorkeur)
- `Stap3_Resultaat.jsx` — tabel met geschikte motors incl. v_netto, "Aanvraag bevestigen"-knop
- `AanvraagBevestigd.jsx` — bevestigingsscherm na versturen

#### Tester
Playwright-scenario's:
1. Klant doorloopt wizard volledig → motor geselecteerd → bevestigd → e-mail ontvangen (mock SMTP)
2. Geen motors gevonden → duidelijke melding, geen crash
3. Stap terug → eerder ingevulde waarden blijven staan
4. Aanvraag verschijnt in `GET /api/klant/aanvragen` na bevestiging
5. Niet-ingelogde gebruiker probeert POST → 401
6. PDF is geldig en bevat correcte selectiegegevens (bestandsgrootte > 0, MIME = application/pdf)

#### Designer
- Wizard: stap-balk bovenaan (Stap 1 / 2 / 3) met visuele voortgang
- Resultaattabel: highlight de "beste match" (eerste rij) met accent-kleur
- Leverancier-badge per rij (Procon / Romeca kleurcodering)
- "Bevestig"-knop alleen actief als klant een motor heeft geselecteerd
- Bevestigingsscherm: checkmark-animatie + "U ontvangt een bevestiging per e-mail"
- Mobiel-responsive wizard (één stap tegelijk, niet naast elkaar)

#### Data-engineer
```sql
tbl_aanvragen:
  id                    INT IDENTITY PRIMARY KEY
  klant_id              INT NOT NULL FK → tbl_klanten
  band_type_id          INT NOT NULL FK → tbl_band_types
  aandrijving_type      NVARCHAR(20) NOT NULL  -- 'rvs_mantel'|'sprocket'|'bekleding'
  invoer_vermogen_w     INT NOT NULL
  invoer_snelheid_ms    DECIMAL(8,4) NOT NULL
  heeft_olie_voorkeur   BIT NULL               -- NULL = geen voorkeur
  status                NVARCHAR(50) DEFAULT 'concept'
  aangemaakt_op         DATETIME2 DEFAULT GETDATE()
INDEX op (klant_id, aangemaakt_op DESC), (status)

tbl_aanvraag_resultaten:
  id              INT IDENTITY PRIMARY KEY
  aanvraag_id     INT NOT NULL FK → tbl_aanvragen
  motor_spec_id   INT NOT NULL FK → tbl_motor_specs
  compat_id       INT NOT NULL FK → tbl_band_motor_compatibiliteit
  v_netto_ms      DECIMAL(8,4)   -- berekend: spec.snelheid * pcd / dnom
  is_geselecteerd BIT DEFAULT 0
  volgorde        INT
```

View `vw_aanvragen`: join met klant_naam, bedrijfsnaam, band_naam, motor_code, leverancier_naam.

#### Cyber-security
- Klant mag alleen **eigen** aanvragen ophalen — controleer `klant_id = session.klant_id` in elke query
- PDF mag geen systeempaden of stack traces bevatten
- E-mailadressen worden gevalideerd (regex + max lengte) vóór SMTP-call
- SMTP-configuratie in `.env`; geen credentials in broncode
- Rate-limit op `POST /api/klant/aanvragen`: max 20 aanvragen per klant per dag

### Acceptatiecriteria
- [ ] Wizard doorloopbaar in 3 stappen zonder verplicht reload
- [ ] Selectie-algoritme retourneert correcte motors op basis van alle criteria
- [ ] PDF gegenereerd met correcte gegevens en verstuurd naar TBA-e-mailadres uit `.env`
- [ ] Klant ontvangt bevestigingsmail
- [ ] Aanvraag zichtbaar in aanvraaghistorie van klant
- [ ] Klant kan geen andere klant's aanvragen zien

---

## Fase 3 — Aanvragen beheer backoffice

### Opdracht
Bouw de backoffice-pagina waarmee TBA-medewerkers alle binnengekomen aanvragen kunnen bekijken, filteren en de status bijhouden.

### Context
TBA verwerkt aanvragen in een extern ERP/offertetool — de webapp hoeft geen offertes te genereren. Wel moet de aanvraag met alle details inzichtelijk zijn zodat een medewerker direct een offerte kan opmaken.

### Per rol

#### Architect
- Pagina: `client/src/pages/Aanvragen.jsx` (of `client/src/pages/aanvragen/` als er meerdere views komen)
- Route: `/backoffice/aanvragen`
- Permission: `requirePermission("/aanvragen*")`

#### Builder
**Express API:**
```
GET  /api/aanvragen             requireAuth + requirePermission — lijst alle aanvragen
GET  /api/aanvragen/:id         detail + geselecteerde motor + klantgegevens
PUT  /api/aanvragen/:id/status  { status: 'offerte_verzonden' }
```

**React:**
- `ClientTable` met kolommen: datum, bedrijfsnaam, contactpersoon, bandtype, vermogen, status
- Filterbalk: status, leverancier, datumrange
- Detail-modal: volledige aanvraaggegevens + motorresultaten + klantcontact
- Status-dropdown per aanvraag (concept → ingediend → offerte_verzonden)

#### Tester
1. Admin ziet overzicht van alle aanvragen
2. Filter op status werkt correct
3. Detail-modal toont volledige aanvraagdata
4. Status-update persisted na refresh
5. Medewerker zonder permission `/aanvragen*` → 403

#### Designer
- Status-badges: concept (grijs), ingediend (blauw), offerte_verzonden (groen)
- Tabel sorteerbaar op datum (nieuwste eerst standaard)
- Detail-modal breed genoeg voor motorresultaattabel

#### Data-engineer
- Geen nieuwe tabellen — view `vw_aanvragen` uitbreiden met klantcontactgegevens
- Index op `tbl_aanvragen.status` voor filterquery's

#### Cyber-security
- Backoffice-medewerker mag klantgegevens zien maar mag nooit `wachtwoord_hash` ophalen (view bevat die nooit)
- Status-wijziging logt een entry in `tbl_user_actions`

### Acceptatiecriteria
- [ ] Alle aanvragen zichtbaar met filter op status/datum
- [ ] Detail-modal toont complete aanvraag + klantgegevens
- [ ] Status bijwerken werkt + gelogd in user_actions
- [ ] Geen klantgegevens lekken buiten permission-grens

---

## Fase 4 — Vermogenscalculator (toekomst)

### Opdracht
Voeg een optionele rekenstap toe **vóór** de wizard: klanten die hun vermogen en snelheid nog niet kennen kunnen deze laten berekenen op basis van bandlengte, productgewicht, hellingshoek en bandtype.

### Context
Dit is de "stap 2" uit het intake-gesprek. De formules moeten worden aangeleverd door TBA / Procon of Romeca. Technische scope is aanzienlijk — deze fase start pas als fase 2 stabiel is en TBA de formules heeft aangeleverd.

### Acties (extern afhankelijk)
- [ ] TBA levert berekeningsformules aan
- [ ] Data-engineer vertaalt formules naar berekening in `server/src/services/vermogen.js`
- [ ] Builder integreert als optionele "rekenmachine"-knop in Stap 2 van de wizard

---

## Samenvatting fasevolgorde

| Fase | Wat | Afhankelijk van | Geschatte omvang |
|---|---|---|---|
| **0** | Data fundament (motors, banden, leveranciers backoffice) | — | ~3 dagen |
| **1** | Klantenportaal registratie + login + KVK | Fase 0 | ~2 dagen |
| **2** | Aanvraag-wizard + selectie-algoritme + PDF + mail | Fase 0 + 1 | ~3 dagen |
| **3** | Aanvragen beheer backoffice | Fase 2 | ~1 dag |
| **4** | Vermogenscalculator | Fase 2 + externe formules | PM |

**Totaal fase 0–3: ~9 werkdagen.**
