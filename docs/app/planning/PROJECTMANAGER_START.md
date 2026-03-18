# Project Manager Start - Trommelmotor Selectietool

Gegenereerd op: 2026-03-17  
Trigger: `ROL: Projectmanager` + `Start`  
Bronplan: `Bouwplan_codex.md`

## Doel van deze start

Het architectuurplan omzetten naar een direct uitvoerbare leveringsflow met:
- heldere fasevolgorde;
- eigenaar per stap;
- harde acceptatiechecks per fase;
- expliciete beslispunten die eerst afgestemd moeten worden.

## Orchestratievolgorde

1. `Product Owner ↔ Architect` (plan bouwklaar maken)
2. `Data-engineer` (datamodel + views + migratiepad)
3. `Builder` (API + frontend)
4. `Cyber-security` (hardening checks)
5. `Tester` (E2E-validatie)
6. `Designer` (UX-consistentie en polish)
7. `Project manager` (go/no-go per fase)

## Fase 0 - Bouwklaar plan (afgerond)

Eigenaren:
- Primair: Product Owner
- Co-owner: Architect

Deliverables:
- Definitieve MVP-scope (wat valt in release 1).
- Uitgewerkte backlog met volgorde en afhankelijkheden.
- Beslisdocument voor open architectuurpunten.

Definition of Done:
- Alle open punten hebben status: `beslist`, `uitgesteld` of `escaleren`.
- Builder kan starten zonder functionele ambiguiteit.

## Architectuurbesluiten (vastgesteld)

Bron: `ARCHITECT_BESLISVOORSTELLEN.md`

1. Canonieke leveranciersnaam: `Rulmeca` (alias-normalisatie vanaf historische varianten).
2. Leverancierskeuze UX: automatische match + optionele leveranciersfilter.
3. Snelheidstolerantie: default ±10% met voorbereid override-model.
4. PDF-doel: commercieel aanvraagdocument met technische bijlage.

## Fase 1 - Datafundament

Status: basis gerealiseerd

Eigenaar:
- Data-engineer

Taken:
- SQL tabellen (`tbl_*`) voor catalogus, banden, klanten, aanvragen.
- SQL views (`vw_*`) voor alle read-scenario's.
- Excel-importpad voor Procon-data + voorbereid pad voor leverancier 2.
- Indexen voor selectiefilters en aanvraaghistorie.

Acceptatie:
- Geen `SELECT *` in views.
- Alle API-leesbehoeften beschikbaar via views.
- Data kan worden ingeladen zonder referentiële fouten.

## Fase 2 - Backoffice stamdata

Status: basis gerealiseerd

Eigenaar:
- Builder

Taken:
- CRUD API voor leveranciers, motortypes, specs, bandtypes, compatibiliteit.
- Backoffice pagina's met bestaand `ClientTable` + modalpatroon.
- Permissions gekoppeld via `PAGE_PATTERNS` + `navItems`.

Acceptatie:
- Admin kan volledige stamdata beheren.
- Niet-geautoriseerde gebruiker krijgt 401/403.

## Fase 3 - Klantenportaal basis

Status: basis gerealiseerd

Eigenaren:
- Builder
- Cyber-security (controle)

Taken:
- Klantregistratie/login/logout/profiel.
- Scheiding klantsessie versus backoffice sessie.
- Eigenaarschap-check op klantdata.

Acceptatie:
- Klant ziet alleen eigen data.
- Backoffice permissies lekken niet naar klantflow.

## Fase 4 - Selectiewizard + aanvraagflow

Status: basis gerealiseerd

Eigenaren:
- Builder
- Data-engineer (query-optimalisatie)

Taken:
- Wizardstappen: basis, selectie, resultaat, definitief.
- Selectie-engine met ranking.
- Definitief maken: PDF + e-mail.

Acceptatie:
- Resultatenlijst geeft topmatch + alternatieven.
- Definitieve aanvraag wordt opgeslagen en bevestigd.

## Fase 5 - Aanvragenbeheer + hardening

Status: actief (hardening + validatie)

Eigenaren:
- Builder
- Cyber-security
- Tester

Taken:
- Backoffice aanvragenoverzicht en statusupdates.
- Audit logging op mutaties/statuswijzigingen.
- Rate limits en security checks op kritieke endpoints.
- Playwright E2E-regressieset.

Acceptatie:
- End-to-end flow slaagt (registratie -> selectie -> aanvraag -> opvolging).
- Security checks zonder blokkerende bevindingen.

## Test- en releasegates

Per fase geldt:
- Functionele test geslaagd.
- Permissie-check geslaagd.
- Geen overschrijding bestandsgrootte-drempels zonder split.
- Geen open blokkerende security finding.

## Directe eerstvolgende acties (nu)

1. Data-engineer start SQL skeleton (`tbl_*`, `vw_*`) conform vastgestelde beslissingen.
2. Builder maakt route-registratie skeleton per featuremodule.
3. Project manager bewaakt fase-1 gates (views, indexes, importpad).

## Update 2026-03-17 (Fase 6 gestart)

Nieuwe orchestratiefase voor UX hardening op basis van tester/designer handoff:
- Zie: `docs/app/planning/PROJECTMANAGER_START_FASE6_UX_HARDENING.md`
