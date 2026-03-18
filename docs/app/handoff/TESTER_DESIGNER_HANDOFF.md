# Tester -> Designer Handoff (2026-03-17)

## Scope getest
- Rolmodel aangescherpt naar `Admin` + `Klant` (Super Admin intern).
- Registratieflow: nieuw account moet standaard `Klant` zijn.
- Klantportaal flow:
  - Home overzicht
  - Nieuwe aanvraag via modal
  - Mijn aanvragen
  - Rolafscherming in navigatie

## Functionele status
- Geslaagd: nieuw account `klant_auto_1712@example.com` kreeg direct rol `Klant`.
- Geslaagd: klant ziet alleen `Home` en `Mijn aanvragen` in sidebar.
- Geslaagd: aanvraag ingediend via modal met echte datasetselectie.
- Geslaagd: topmatch + alternatieven + scorevelden zichtbaar na submit.
- Geslaagd: rolbeheer toont nu expliciet beide klantenportaal-patronen:
  - `/klantenportaal/aanvragen*`
  - `/klantenportaal/aanvragen/mijn*`

## Builder-fixes die tijdens test zijn doorgevoerd
- Default registratie van `user` -> `Klant`.
- Rol-API filters op `Admin/Klant`.
- SQL migratie toegevoegd voor rolnormalisatie.
- Dubbele Home navigatie voor klanten verwijderd.
- 500 op klantenportaal-overzicht opgelost (view-schema gesynchroniseerd).

## Designer reviewpunten (visueel/UX)
- Positief:
  - Modal-aanvraagflow werkt overzichtelijk met blokken `Product`, `Proces`, `Resultaat`.
  - Paarse accentrichting is zichtbaar in klantenportaal-styling.
- Nog aan te scherpen:
  - Header-titel/subtitel op klant-home tonen nog generieke `Home` copy.
  - Status- en datumweergave in tabellen is functioneel maar nog “technisch” (ISO-datum).
  - CTA-hiërarchie in modal mag sterker: primaire submit visueel nog weinig dominant bij lange forms.
  - Resultaattabel is informatief maar compactheid op kleinere schermen kan beter.

## Aanbevolen designer-opvolging
1. Herlabel klant-home header naar domeinspecifieke copy (geen generieke dashboardtekst).
2. Maak datum-/statuspresentatie klantvriendelijker (menselijke datumformaten + consistente statusbadges).
3. Versterk visuele progressie in modal (stepper of duidelijke sectienavigatie).
4. Optimaliseer mobiele tabelpresentatie voor selectie-resultaten.
