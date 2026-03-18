# Project Manager Start - Fase 6 UX Hardening

Gegenereerd op: 2026-03-17  
Trigger: `ROL: Projectmanager` + `Start`  
Input: `docs/app/handoff/TESTER_DESIGNER_HANDOFF.md`

## Doel van deze fase

De functioneel geslaagde klantflow doorzetten naar productieklare UX-kwaliteit:
- heldere klantspecifieke copy;
- leesbare status-/datumweergave;
- sterkere modal-flow en CTA-hiërarchie;
- mobiele bruikbaarheid van resultaten.

## Fasevolgorde en eigenaars

1. Architect: scope en UX-grenzen bevestigen.
2. Product Owner: user stories + acceptatiecriteria concretiseren.
3. Builder + Designer: implementatie van UI/UX verbeteringen.
4. Tester: Playwright regressie op klantflow + visuele checks.
5. Projectmanager: go/no-go op releasegate.

## Architect besluitkader (direct)

- Geen nieuwe functionele domeinen toevoegen.
- Alle wijzigingen blijven binnen klantenportaal routes:
  - `/klantenportaal/aanvragen*`
  - `/klantenportaal/aanvragen/mijn*`
- Entry files (`App.jsx`, `index.js`) blijven orchestration-only.

## Product Owner backlog (bouwklaar)

### Story 1 - Klant-home copy
- Als klant wil ik domeinspecifieke paginatitels en subtitels, zodat ik direct snap waar ik ben.
- Acceptatie:
  - Headertekst verwijst naar klantenportaal-context, niet generiek dashboard.

### Story 2 - Datums en statussen
- Als klant wil ik leesbare datums/statussen, zodat ik snel voortgang begrijp.
- Acceptatie:
  - Geen ISO-datums zichtbaar in klanttabellen.
  - Statusbadge-stijl consistent op Home en Mijn aanvragen.

### Story 3 - Modal progressie
- Als klant wil ik duidelijke voortgang in de aanvraagmodal, zodat lange invoer behapbaar blijft.
- Acceptatie:
  - Sectieprogressie visueel herkenbaar.
  - Primaire CTA blijft duidelijk zichtbaar tijdens scrollen.

### Story 4 - Mobiele resultaatweergave
- Als klant wil ik selectie-uitkomsten mobiel kunnen lezen zonder horizontale chaos.
- Acceptatie:
  - Resultaattabel bruikbaar op mobiel (wrap/card/priority kolommen).

## Builder uitvoeringstaken

1. Pas klant-home page-meta aan naar domeinspecifieke titel/subtitel.
2. Introduceer datumformatter helper voor klantenportaal views.
3. Harmoniseer statusbadge componentgebruik.
4. Versterk modal CTA-hiërarchie (sticky actions of duidelijke afsluitende actiezone).
5. Implementeer mobielvriendelijke resultaatpresentatie.

## Tester taken (Playwright-first)

1. Regressie: klant ziet alleen toegestane navigatie-items.
2. Regressie: nieuwe aanvraag via modal inclusief resultaatlijst.
3. Validatie: datums zijn menselijk formaat (`nl-NL`) op Home/Mijn aanvragen.
4. Validatie: statusbadges consistent op beide pagina's.
5. Responsive check: mobiel viewport voor resultatensectie.

## Designer reviewpakket

- Contrast en hiërarchie op primaire CTA.
- Rust en scanbaarheid in modal met lange formulieren.
- Mobiele leesbaarheid van resultaatoutput.
- Paarse merkaccenten functioneel én consistent (geen overaccenting).

## Releasegate (Projectmanager)

Een fase is pas klaar als:
- alle Story-acceptatiecriteria aantoonbaar gehaald zijn;
- Playwright regressie groen is;
- `guardrails:strict` groen blijft;
- geen permission drift of route drift ontstaat.

## Startbesluit

Fase 6 is hierbij officieel gestart.  
Volgende uitvoeringsrol: **Builder (met Designer pairing)**.
