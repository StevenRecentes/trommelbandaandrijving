# Architect Plan -> Builder Brief (Klantenportaal V2)

## Doel
Lever een rolzuivere, werkende en visueel sterkere klantenportaalflow op, met:
- aparte klant-home ervaring;
- duidelijke scheiding tussen "home", "mijn aanvragen" en "nieuwe aanvraag";
- werkende aanvraag-invoer voor klantrol zonder backoffice-permissies;
- status-overzicht met "nieuw sinds laatste gezien";
- verbeterde UX/look (paarse accenten, minder statisch).

---

## Architectuurbesluiten

1. Twee home-ervaringen:
- Backoffice behoudt bestaande Home (`/` -> dashboard/backoffice).
- Klant krijgt eigen startervaring op `"/klantenportaal/home"` met:
  - laatste 5 aanvragen;
  - lopende aanvragen per status;
  - indicator "nieuwe status sinds laatst gezien".

2. Scheiding van klantfuncties:
- `"/klantenportaal/home"` -> overzicht/status.
- `"/klantenportaal/aanvragen"` -> alleen "Mijn aanvragen" (ClientTable).
- nieuwe aanvraag via modal op aanvragenpagina (niet meer lange inline form).

3. Permissiezuivere metadata:
- Klantenportaal gebruikt **geen** `"/gegevens/*"` endpoints.
- Nieuwe klantveilige read-endpoints onder `"/klantenportaal/meta/*"` met guard `requirePermission("/klantenportaal/aanvragen*")`.

4. Status-seen model:
- Per gebruiker/aanvraag status-view tracking via nieuwe tabel `tbl_aanvraag_status_views`.
- "Nieuw" als `aanvraag.bijgewerkt_op > last_seen_at` voor de gebruiker.

5. UI/Design richting:
- Paarse thematische variant als klantportaal-accent (token-based, geen hardcoded random kleuren).
- 3-sectie modalflow: Product -> Proces -> Controle.
- subtiele animaties: modal step transition, status badge pulse (alleen nieuwe), row reveal.

---

## Scope (Builder)

### Blok 1 - Data/API correct (kritiek)
1. Voeg tabel toe:
- `sql/tables/021_aanvraag_status_views.sql`
  - `id`, `aanvraag_id`, `user_id`, `last_seen_status`, `last_seen_at`, timestamps.
  - unieke index op `(aanvraag_id, user_id)`.

2. Voeg views toe:
- `vw_klantenportaal_home` (samengestelde read-view met status + nieuw-vlag info per user-context via API-parameterized query).
- of alternatief: gerichte query in service-laag met expliciete kolommen (geen `SELECT *`).

3. Nieuwe endpoints (allemaal `requireAuth + requirePermission("/klantenportaal/aanvragen*")`):
- `GET /api/klantenportaal/meta/band-types`
- `GET /api/klantenportaal/meta/uitvoering-types`
- `GET /api/klantenportaal/meta/Aansluiting-types`
- `GET /api/klantenportaal/home` (laatste 5 + statussamenvatting + nieuw-indicator)
- `POST /api/klantenportaal/aanvragen/:id/mark-seen` (status gezien markeren)

4. Bestaande klantaanvraag-create route:
- behoud `POST /api/klantenportaal/aanvragen`
- valideer dat alle modalvelden worden ondersteund.

### Blok 2 - Frontend structuur
1. Nieuwe pagina:
- `client/src/pages/KlantenportaalHome.jsx`
  - kaarten: laatste 5, statuscounts, nieuw-status lijst.

2. Refactor bestaande pagina:
- `KlantenportaalAanvragen.jsx`
  - tabel "Mijn aanvragen" via ClientTable.
  - knop "Nieuwe aanvraag" opent modal.
  - modal met 3 stappen:
    - Product (band/uitvoering/Aansluiting)
    - Proces (vermogen/snelheid/transporteur/opvoer/trommellengte)
    - Controle + submit

3. Router/nav:
- voeg route `"/klantenportaal/home"` toe.
- behoud `"/klantenportaal/aanvragen"`.
- klant default landing = `"/klantenportaal/home"` (als geen backoffice-home permissie of als primaire klantflow).

### Blok 3 - Design/UX uplift
1. Klantportaal styles in aparte page stylesheet:
- `client/src/styles/pages/klantenportaal.css`

2. Paarse accent tokens:
- gebruik CSS variabelen (bijv. `--kp-accent`, `--kp-accent-strong`, `--kp-focus-ring`) en koppel aan componenten in klantportaal.

3. Motion:
- step transition (opacity/translate).
- status badge animation alleen bij `is_new_status = true`.

---

## File-indeling (verplicht)

Backend:
- `server/src/routes/klantenportaalRoutes.js` (nieuw, klantgerichte endpoints)
- `server/src/services/klantenportaalService.js` (nieuw, query + status-seen logic)
- bestaande `aanvraagRoutes.js` klein houden; klant-meta/homeroutes niet verder oppompen.

Frontend:
- `client/src/pages/KlantenportaalHome.jsx` (nieuw)
- `client/src/pages/KlantenportaalAanvragen.jsx` (refactor)
- `client/src/components/aanvragen/NieuweAanvraagModal.jsx` (nieuw)
- `client/src/components/aanvragen/NieuweAanvraagStepper.jsx` (nieuw)
- `client/src/styles/pages/klantenportaal.css` (nieuw)

DB:
- `sql/tables/021_aanvraag_status_views.sql`
- `sql/views/027_create_vw_klantenportaal_home.sql` (indien view-based leesmodel gekozen)

---

## Acceptatiecriteria (Builder + Tester)

1. Klant met alleen `"/home*"`, `"/profiel*"`, `"/klantenportaal/aanvragen*"` kan:
- klantenportaal home laden;
- nieuwe aanvraag volledig invullen en indienen;
- mijn aanvragen en statussen zien.

2. Klant kan **niet**:
- `/accounts`, `/rollen`, `/gegevens/*`, `/aanvragen` backenddata benaderen (403/redirect correct).

3. Klantenportaal gebruikt geen `/gegevens/*` calls meer.

4. Home toont:
- laatste 5 aanvragen;
- statusoverzicht;
- nieuw-status indicator op basis van seen-state.

5. UI:
- nieuwe aanvraag via modal-stepper;
- duidelijk paarse accenttaal in klantportaal;
- minder statische feel (minimaal 2 betekenisvolle motions).

6. Technisch:
- `npm run guardrails:strict` groen.
- relevante tests groen.
- Playwright scenario groen:
  - "Klant kan aanvraag indienen zonder gegevens-permissies".

---

## Handoff naar Builder (directe opdracht)

Builder: implementeer Blok 1 -> Blok 2 -> Blok 3 in deze volgorde.

Start met beveiligingskritieke fix:
1. `"/klantenportaal/meta/*"` endpoints + frontend omschakelen weg van `"/gegevens/*"`.
2. Daarna pas UX/refactor (home split + modal-stepper).
3. Sluit af met Playwright test en guardrails bewijs.
