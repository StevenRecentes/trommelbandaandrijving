# E2E Usecase Demo (Echte Data)

## Demo-input
- Bandtype: `Soliflex Pro mini 2,0`
- Uitvoering: `RVS mantel met spie en sprockets` (`sprocket`)
- Aansluiting: `T4 klemmenkast RVS`
- Gevraagd vermogen: `300 W`
- Gewenste bandsnelheid: `0.65 m/s`
- Tolerantie: `10%`

## Verwacht resultaatformat
- Topmatch + alternatieven (gesorteerd op ranking)
- Per resultaat zichtbaar:
  - leverancier
  - motortype
  - vermogen
  - netto bandsnelheid
  - snelheid delta
  - score

## Uitgevoerde run (na import)
Bron: `selectMotorCandidates` met geïmporteerde DB-data.

Top 3:
1. `Procon PT113X2 Beta` - `300 W` - netto `0.646018 m/s` - delta `0.6126%` - score `94.5405`
2. `Rulmeca TM113LS` - `300 W` - netto `0.646018 m/s` - delta `0.6126%` - score `94.5405`
3. `Rulmeca TM113LS DER` - `310 W` - netto `0.646018 m/s` - delta `0.6126%` - score `93.8739`

## Inhoudelijke formulecheck tegen bronlogica
- Uit `Bandgegevens` (Soliflex Pro mini 2,0, PT113, sprocket): `PCD = 146`
- Voor kandidaat met `Dnom = 113` en motorsnelheid `0.5 m/s`:
  - `netto = (0.5 / 113) * 146 = 0.646018 m/s`
- Dit komt exact overeen met de selectie-output.

## UI-weergave
- `Klantenportaal Aanvragen` toont invoer en selectie-uitkomst op 1 scherm.
- Tabel toont nu expliciet:
  - `Netto snelheid`
  - `Delta %`
  - `PCD`
  - `Score`
