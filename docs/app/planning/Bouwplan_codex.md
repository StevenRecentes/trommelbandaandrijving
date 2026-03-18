# Bouwplan Codex - Architectuuruitwerking

Gegenereerd op: 2026-03-17  
Actieve rol: Architect  
Bronnen:
- `Project_uiteenzetting/Kennismaken-ba9ff967-323e.docx`
- `Project_uiteenzetting/Webapplicatie Trommelmotor Selectietool.pdf`
- `Project_uiteenzetting/Ammdrive overzicht en berekening.xlsx`
- `Project_uiteenzetting/Uitwerking..xlsx`
- `AGENTS.md`

## 1. Architectuurdoel

We bouwen een schaalbare, beveiligde webapplicatie die:
- de huidige Excel-selectie vervangt;
- twee duidelijke domeinen scheidt: klantenportaal en backoffice;
- uitbreiding naar meerdere leveranciers en extra rekenstappen mogelijk maakt zonder herbouw.

Architectuurprincipe:
- `client/src/App.jsx` en `server/src/index.js` blijven orchestration-only;
- businesslogica zit in featuremodules;
- reads via `vw_*`, writes via `tbl_*`;
- alle protected routes via `requireAuth` + `requirePermission`.

## 2. Scope en grenzen

In scope (MVP + groeipad):
- Stamdatabeheer: leveranciers, motortypes, motorspecs, bandtypes, uitvoeringen, Aansluitingen.
- Klantregistratie/login/profiel met bedrijfscontext.
- Selectiewizard met ranking van meerdere geschikte motoren.
- Aanvraagfinalisatie met PDF + e-mail.
- Backoffice aanvragenoverzicht met statusbeheer.

Buiten scope (nu):
- ERP/CRM-koppelingen.
- Dynamische prijsberekening met marges/kortingen.
- Volledige engineering calculator als verplichte eerste stap.

## 3. Systeemcontext

Gebruikers:
- Klant (technisch inkoper/engineer): selectie en aanvraag.
- Backoffice admin/medewerker: databeheer en opvolging.

Componenten:
- React frontend (`client/`) met gescheiden route-gebieden.
- Express API (`server/src`) voor auth, domeinlogica, PDF/e-mail orchestration.
- SQL Server (`sql/`) met tabellen en read-views.
- Optionele .NET API blijft buiten hoofdflow tenzij later expliciet gekozen.

## 4. Domeinindeling

### 4.1 Portalen

- Klantenportaal:
  - Prefix: `/klantenportaal/*`
  - Focus: account, selectie, aanvragenhistorie.
- Backoffice:
  - Prefix: `/backoffice/*`
  - Focus: stamdata + aanvragenbeheer.

### 4.2 Bounded features

- `catalogus`: leveranciers, motortypes, specs, uitvoeringen.
- `banden`: bandtypes en compatibiliteitsmatrix.
- `aanvragen`: aanvraag lifecycle en resultaten.
- `auth-klant`: klantregistratie/login/sessie.
- `auth-backoffice`: bestaand auth/permission model.

## 5. Doelstructuur code (feature-first)

Backend (Express):

```text
server/src/
  routes/
    catalogus/
      registerCatalogusRoutes.js
      listCatalogusHandlers.js
      mutateCatalogusHandlers.js
    banden/
      registerBandenRoutes.js
      listBandenHandlers.js
      mutateBandenHandlers.js
    aanvragen/
      registerAanvraagRoutes.js
      klantAanvraagHandlers.js
      backofficeAanvraagHandlers.js
    klantAuth/
      registerKlantAuthRoutes.js
  services/
    selectie/
      selectieEngine.js
      rankingRules.js
    pdf/
      aanvraagPdfService.js
    mail/
      aanvraagMailService.js
    imports/
      excelImportService.js
```

Frontend (React):

```text
client/src/
  pages/
    klantenportaal/
      Login.jsx
      Register.jsx
      Profiel.jsx
      aanvragen/
        AanvragenIndex.jsx
        AanvraagNieuw.jsx
        steps/
          StepBasisgegevens.jsx
          StepSelectieOpties.jsx
          StepResultaat.jsx
          StepDefinitief.jsx
    backoffice/
      gegevens/
        MotorsPage.jsx
        BandenPage.jsx
        LeveranciersPage.jsx
        UitvoeringenPage.jsx
      aanvragen/
        AanvragenPage.jsx
        AanvraagDetailModal.jsx
```

CSS:
- pagina-specifiek in `client/src/styles/pages/*.css`;
- gedeelde patronen in `components.css`, `layout.css`;
- geen grote nieuwe monolith stylesheets.

## 6. Datamodel (architectuurbesluit)

### 6.1 Kernentiteiten

- `tbl_leverancier`
- `tbl_motortype`
- `tbl_motor_spec`
- `tbl_band_type`
- `tbl_band_compat`
- `tbl_uitvoering_type`
- `tbl_Aansluiting_type`
- `tbl_klant`
- `tbl_aanvraag`
- `tbl_aanvraag_resultaat`

Read-models:
- `vw_motor_catalogus`
- `vw_band_catalogus`
- `vw_aanvraag_klant`
- `vw_aanvraag_backoffice`

### 6.2 Normalisatiekeuze

Excel bevat veel “matrix”-structuren. Architectuurbesluit:
- in database alleen rijgebaseerde records;
- geen leverancier-specifieke kolommen in tabelstructuur;
- leverancier is attribuut/relatie, geen aparte tabelset per leverancier.

Dit voorkomt herbouw wanneer leverancier 2/3 wordt toegevoegd.

### 6.3 Prestatie-indexen (minimaal)

- `tbl_motor_spec`: index op `(leverancier_id, vermogen_w, snelheid_ms)`.
- `tbl_band_compat`: index op `(band_type_id, uitvoering_type_id, motortype_id)`.
- `tbl_aanvraag`: index op `(klant_id, aangemaakt_op DESC)` en `(status, aangemaakt_op DESC)`.
- `tbl_aanvraag_resultaat`: index op `(aanvraag_id, ranking_score DESC)`.

## 7. Selectie-engine ontwerp

Input:
- bandtype
- uitvoering
- benodigd vermogen
- gewenste snelheid
- optionele leveranciersvoorkeur
- olievoorkeur/hygiene-eis

Filterstappen:
1. Kandidaten uit `vw_motor_catalogus` op compatibiliteit.
2. Vermogen: `motor_vermogen >= gevraagd_vermogen`.
3. Snelheid binnen tolerantie.
4. Olie/hygiene filter.
5. Ranking:
   - exact speed proximity;
   - minimale overcapaciteit vermogen;
   - voorkeurleverancier;
   - beschikbaarheidsscore.

Output:
- topmatch + alternatieven;
- score en redenvelden voor uitlegbaarheid.

Architectuurbesluit:
- rankingregels in aparte module (`rankingRules.js`), zodat businessregels zonder routewijziging aanpasbaar zijn.

## 8. Auth, autorisatie en securitygrenzen

Backoffice:
- verplicht `requireAuth` + `requirePermission`.
- permissiepatronen opnemen in `PAGE_PATTERNS` en client-nav.

Klantenportaal:
- eigen klantauth middleware (bijv. `requireKlantAuth`) met session binding.
- klant mag alleen eigen aanvragen lezen/wijzigen.

Verplicht:
- parameterized SQL;
- CSRF-token via `client/src/api.js`;
- rate limiting op login en aanvraag-endpoints;
- audit logging voor mutaties en statuswissels.

## 9. API-grenzen (contractniveau)

Catalogus/backoffice:
- `GET /api/catalogus/motor-specs`
- `POST /api/catalogus/motor-specs`
- `PUT /api/catalogus/motor-specs/:id`
- `DELETE /api/catalogus/motor-specs/:id`
- analoog voor banden, leveranciers, uitvoeringen.

Klant:
- `POST /api/klant/register`
- `POST /api/klant/login`
- `POST /api/klant/logout`
- `GET /api/klant/profiel`
- `PUT /api/klant/profiel`

Aanvragen:
- `POST /api/klant/aanvragen` (concept + selectie-resultaten)
- `POST /api/klant/aanvragen/:id/definitief` (PDF + e-mail)
- `GET /api/klant/aanvragen`
- `GET /api/backoffice/aanvragen`
- `PUT /api/backoffice/aanvragen/:id/status`

## 10. Migratie- en uitrolstrategie

### Fase A - Datafundament
- Tabellen/views aanmaken.
- Importscript voor Exceldata.
- Datakwaliteit-checks: ontbrekende referenties, numerieke ranges.

### Fase B - Backoffice CRUD
- Eerst beheer tools live, zodat data in app beheerd kan worden.
- Excel wordt read-only referentie tijdens overgang.

### Fase C - Klantenportaal + selectie
- Wizard activeren achter feature flag.
- Pilot met beperkt klantsegment.

### Fase D - Productie en hardening
- Logging/monitoring aanscherpen.
- Performance tuning op echte querypatronen.

## 11. Faseringsbacklog per rol

Architect:
- modulegrenzen definitief vastleggen;
- ADR’s documenteren bij afwijkingen.

Builder:
- featuremodules implementeren conform structuur;
- routes registreren via `register<Feature>Routes({ ...deps })`.

Tester:
- Playwright suites per fase;
- permissie- en regressietests verplicht.

Designer:
- UX-consistentie met bestaand patroon;
- wizard-flow en feedbackstates optimaliseren.

Data-engineer:
- SQL scripts + views + indexen;
- import/validaties voor Excel-naar-SQL.

Cyber-security:
- routebeveiliging, rate limits, secret management;
- blokkades melden bij ongeautoriseerde datatoegang.

## 12. Architectuurbeslissingen (vastgesteld)

Bronbesluit: `ARCHITECT_BESLISVOORSTELLEN.md` (2026-03-17)

1. Leveranciersnaam harmonisatie:
   - canoniek: `Rulmeca`;
   - historische varianten (zoals `Romeca`) worden genormaliseerd.
2. Leverancierskeuze in UX:
   - standaard automatische engine-match;
   - optionele leveranciersfilter voor gevorderde gebruiker.
3. Snelheidstolerantie:
   - default ±10%;
   - ontwerp voorbereid op override per band/uitvoering.
4. PDF-template:
   - commercieel aanvraagdocument;
   - met technische bijlage in hetzelfde document.

## 13. Acceptatiecriteria (architectuurniveau)

- [ ] Portalen zijn technisch gescheiden (routes, permissions, UI-navigatie).
- [ ] Geen businesslogica in `App.jsx` of `server/src/index.js`.
- [ ] Alle GET’s lopen via `vw_*`, writes via `tbl_*`.
- [ ] Selectie-engine is modulair en testbaar buiten routes om.
- [ ] Nieuwe leverancier kan worden toegevoegd zonder schemawijziging in kernentiteiten.
- [ ] Backoffice en klantdata zijn autorisatie-technisch strikt gescheiden.
- [ ] Bestandsgroottes blijven binnen projectdrempels; overschrijding leidt tot verplichte splitsing.
