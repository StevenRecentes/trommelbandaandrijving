const DEFAULT_SPEED_TOLERANCE_PCT = 0.1;

function buildRankingScore({ speedDeltaRatio, overCapacityRatio, leverancierMatch, AansluitingBonus }) {
  const speedScore = Math.max(0, 1 - speedDeltaRatio) * 75;
  const capacityScore = Math.max(0, 1 - overCapacityRatio) * 20;
  const supplierScore = leverancierMatch ? 5 : 0;
  return Number((speedScore + capacityScore + supplierScore + (AansluitingBonus || 0)).toFixed(4));
}

function deriveProcessPowerFactor({ soortTransporteur, opvoerhoekGraden, opvoerhoogteM }) {
  const name = String(soortTransporteur || "").trim().toLowerCase();
  const angle = Math.max(0, Number(opvoerhoekGraden || 0));
  const height = Math.max(0, Number(opvoerhoogteM || 0));
  let factor = 1;
  if (name.includes("opvoer")) factor += 0.08;
  if (name.includes("knik")) factor += 0.12;
  if (name.includes("zwanenhals")) factor += 0.15;
  factor += Math.min(0.3, angle / 90 * 0.3);
  factor += Math.min(0.25, height / 5 * 0.25);
  return factor;
}

function deriveAansluitingBonus(AansluitingTypeId, motortypeCode) {
  const id = Number(AansluitingTypeId || 0);
  if (!id) return 0;
  const isDer = String(motortypeCode || "").toUpperCase().includes("DER");
  if (id === 1) return isDer ? 0 : 2; // T1: lichte voorkeur voor standaard oliegevuld
  if (id === 3) return isDer ? 2 : 0; // T5: lichte voorkeur voor DER-varianten
  return 1; // T4: neutraal lichte bonus
}

async function selectMotorCandidates({
  db,
  bandTypeId,
  uitvoeringTypeId,
  AansluitingTypeId,
  vermogenW,
  snelheidMs,
  olieVoorkeur,
  soortTransporteur,
  opvoerhoekGraden,
  opvoerhoogteM,
  trommellengteMm,
  leverancierId,
  tolerancePct = DEFAULT_SPEED_TOLERANCE_PCT,
}) {
  const processPowerFactor = deriveProcessPowerFactor({ soortTransporteur, opvoerhoekGraden, opvoerhoogteM });
  const adjustedPower = vermogenW === null || vermogenW === undefined ? null : Number(vermogenW) * processPowerFactor;

  const pool = await db.getPool();
  const request = pool.request();
  request.input("band_type_id", bandTypeId || null);
  request.input("uitvoering_type_id", uitvoeringTypeId || null);
  request.input("min_vermogen", adjustedPower ?? null);
  request.input("target_snelheid", snelheidMs ?? null);
  request.input("trommellengte_mm", trommellengteMm ?? null);
  request.input("olie_voorkeur", olieVoorkeur || null);
  request.input("leverancier_id", leverancierId || null);
  request.input("tolerance_factor", 1 + tolerancePct);
  request.input("inverse_tolerance_factor", 1 - tolerancePct);

  const result = await request.query(`
    SELECT
      ms.id AS motor_spec_id,
      ms.leverancier_id,
      ms.leverancier_naam,
      ms.motortype_id,
      ms.motortype_code,
      ms.diameter_nominaal_mm,
      ms.vermogen_w,
      ms.snelheid_ms,
      ms.force_n,
      ms.torque_nm,
      ms.olie_type,
      bc.tandenaantal,
      bc.pcd_mm,
      CASE
        WHEN ms.diameter_nominaal_mm IS NULL OR ms.diameter_nominaal_mm = 0 OR bc.pcd_mm IS NULL OR bc.pcd_mm = 0
          THEN ms.snelheid_ms
        ELSE ROUND((ms.snelheid_ms / ms.diameter_nominaal_mm) * bc.pcd_mm, 6)
      END AS netto_snelheid_ms
    FROM dbo.vw_motor_specs ms
    INNER JOIN dbo.vw_band_motor_compatibiliteit bc
      ON bc.motortype_id = ms.motortype_id
     AND bc.band_type_id = @band_type_id
     AND bc.uitvoering_type_id = @uitvoering_type_id
     AND bc.actief = 1
    WHERE ms.actief = 1
      AND (@min_vermogen IS NULL OR ms.vermogen_w >= @min_vermogen)
      AND (
        @trommellengte_mm IS NULL
        OR (
          (ms.lengte_min_mm IS NULL OR ms.lengte_min_mm <= @trommellengte_mm)
          AND (ms.lengte_max_mm IS NULL OR ms.lengte_max_mm >= @trommellengte_mm)
        )
      )
      AND (
        @target_snelheid IS NULL
        OR (
          CASE
            WHEN ms.diameter_nominaal_mm IS NULL OR ms.diameter_nominaal_mm = 0 OR bc.pcd_mm IS NULL OR bc.pcd_mm = 0
              THEN ms.snelheid_ms
            ELSE (ms.snelheid_ms / ms.diameter_nominaal_mm) * bc.pcd_mm
          END
        ) BETWEEN (@target_snelheid * @inverse_tolerance_factor) AND (@target_snelheid * @tolerance_factor)
      )
      AND (@olie_voorkeur IS NULL OR @olie_voorkeur = '' OR ms.olie_type = @olie_voorkeur)
      AND (@leverancier_id IS NULL OR ms.leverancier_id = @leverancier_id)
  `);

  const targetSpeed = Number(snelheidMs || 0);
  const targetPower = Number(adjustedPower || 0);
  const rows = (result.recordset || []).map((item) => {
    const nettoSnelheid = Number(item.netto_snelheid_ms || item.snelheid_ms || 0);
    const speedDeltaRatio = targetSpeed > 0 ? Math.abs(nettoSnelheid - targetSpeed) / targetSpeed : 0;
    const overCapacityRatio = targetPower > 0 ? Math.max(0, Number(item.vermogen_w) - targetPower) / targetPower : 0;
    const nettoForce = nettoSnelheid > 0 ? Number(item.vermogen_w || 0) / nettoSnelheid : Number(item.force_n || 0);
    return {
      ...item,
      netto_snelheid_ms: Number(nettoSnelheid.toFixed(6)),
      netto_force_n: Number(nettoForce.toFixed(3)),
      snelheid_delta_pct: Number((speedDeltaRatio * 100).toFixed(4)),
      speedDeltaRatio,
      overCapacityRatio,
      AansluitingBonus: deriveAansluitingBonus(AansluitingTypeId, item.motortype_code),
      ranking_score: buildRankingScore({
        speedDeltaRatio,
        overCapacityRatio,
        leverancierMatch: leverancierId ? Number(item.leverancier_id) === Number(leverancierId) : false,
        AansluitingBonus: deriveAansluitingBonus(AansluitingTypeId, item.motortype_code),
      }),
    };
  });

  rows.sort((a, b) => {
    if (b.ranking_score !== a.ranking_score) return b.ranking_score - a.ranking_score;
    if (a.speedDeltaRatio !== b.speedDeltaRatio) return a.speedDeltaRatio - b.speedDeltaRatio;
    if (Number(a.vermogen_w) !== Number(b.vermogen_w)) return Number(a.vermogen_w) - Number(b.vermogen_w);
    if (String(a.motortype_code || "") !== String(b.motortype_code || "")) {
      return String(a.motortype_code || "").localeCompare(String(b.motortype_code || ""));
    }
    return Number(a.motor_spec_id) - Number(b.motor_spec_id);
  });

  return rows.map((item, index) => ({ ...item, volgorde: index + 1 }));
}

module.exports = {
  selectMotorCandidates,
  DEFAULT_SPEED_TOLERANCE_PCT,
};
