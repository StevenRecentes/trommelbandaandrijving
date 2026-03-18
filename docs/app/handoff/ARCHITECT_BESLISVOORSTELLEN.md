# Architect Beslisvoorstellen - Fase 0

Datum: 2026-03-17  
Status: Besloten door Project manager + Architect

Doel:
- De 4 open architectuurpunten omzetten naar concrete keuzes zodat bouw kan starten.

## Beslispunt 1 - Canonieke leveranciersnaam

Vraag:
- Gebruiken we `Romeca` of `Rulmeca` als officiële naam in data/model/UI?

Voorstel (aanbevolen):
- Gebruik **`Rulmeca`** als canonieke leveranciersnaam.

Motivatie:
- In bestaande databronnen en plannen komt `Rulmeca` terug als fabrikant- en modelcontext (`TM*`-modellen).
- Dit voorkomt dubbele leveranciersrecords door typefouten/variantnamen.

Implementatie-impact:
- `tbl_leverancier.naam`: canonieke waarde `Rulmeca`.
- Eventueel aliasveld (`display_naam` of mapping in import) voor historische varianten zoals `Romeca`.
- Excel import normaliseert `Romeca` -> `Rulmeca`.

Fallback:
- Als commercieel gewenst: intern `Rulmeca`, extern label “Romeca (Rulmeca)” in UI/PDF.

## Beslispunt 2 - Leverancierskeuze in UX

Vraag:
- Kiest klant leverancier expliciet, of kiest engine automatisch?

Voorstel (aanbevolen):
- **Automatische engine-keuze met optionele filter**:
  - standaard: toon beste match leverancier-onafhankelijk;
  - geavanceerde optie: “Beperk op leverancier” (optioneel veld).

Motivatie:
- Sluit aan op intake: klant moet primair geholpen worden met juiste oplossing, niet met interne merkkeuze.
- Geeft tegelijk controle voor gebruikers met expliciete merkvoorkeur.

Implementatie-impact:
- Wizard stap 2: veld `leveranciersvoorkeur` optioneel.
- Rankingregel: voorkeurleverancier geeft scorebonus, maar blokkeert niet tenzij expliciet gefilterd.

Fallback:
- MVP-minimaal: geen leverancierskeuze in UI, alleen automatische match; filter in fase 2.1 toevoegen.

## Beslispunt 3 - Snelheidstolerantie

Vraag:
- Vaste globale tolerantie of configureerbaar per band/uitvoering?

Voorstel (aanbevolen):
- **Hybride model**:
  - globale default tolerantie: **±10%** (MVP);
  - overridable per band/uitvoering via configuratietabel (fase 1 databasis al voorbereiden).

Motivatie:
- ±10% is al benoemd in eerdere plannen en geeft direct hanteerbaar gedrag.
- Door override-structuur vermijden we latere refactor als bandspecs afwijken.

Implementatie-impact:
- Configbron:
  - default in app settings;
  - optionele tabel `tbl_selectie_tolerantie` met keys (band_type_id, uitvoering_type_id, tolerance_pct).
- `rankingRules.js` leest eerst specifieke override, anders default.

Fallback:
- Alleen globale ±10% in MVP en override uitstellen.

## Beslispunt 4 - PDF-doel en inhoud

Vraag:
- Wordt PDF primair technisch rapport of commercieel aanvraagdocument?

Voorstel (aanbevolen):
- **Commercieel aanvraagdocument met technische bijlage in dezelfde PDF**.

Motivatie:
- Primaire businessflow is aanvraag/offerte-opvolging.
- Backoffice en klant hebben wel technische traceerbaarheid nodig.

Implementatie-impact:
- Secties in PDF:
  1. Aanvraagkop (klant/project/datum/referentie)
  2. Gekozen motor + top alternatieven
  3. Technische parameters en filtercriteria
  4. Disclaimer en contactblok TBA
- PDF-service krijgt template met duidelijke blokken i.p.v. losse key-value dump.

Fallback:
- Eerst technisch rapport (sneller), commercieel format in fase 4 hardening.

## Samenvatting voorgestelde beslissingen

1. Leveranciersnaam: **Rulmeca** (canoniek), met alias-normalisatie.
2. UX leverancierskeuze: **automatische match + optionele leveranciersfilter**.
3. Snelheidstolerantie: **default ±10% + voorbereid op per-band/uitvoering override**.
4. PDF: **commercieel aanvraagdocument met technische bijlage**.

## Besluitregistratie

- Besluitdatum: 2026-03-17
- Beslist door: `Project manager` + `Architect`
- Resultaat: punten 1 t/m 4 definitief vastgesteld voor MVP.

## Startadvies na akkoord

Na akkoord op bovenstaande 4 punten:
- status Fase 0 -> `beslist`;
- Builder/Data-engineer starten direct met fase 1 skeleton;
- beslissingen vastleggen in `Bouwplan_codex.md` sectie “Open architectuurbeslissingen” als “Besloten”.
