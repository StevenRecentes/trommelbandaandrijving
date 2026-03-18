import { useEffect, useMemo, useRef, useState } from "react";
import { createKlantAanvraag, fetchKlantMeta, previewKlantAanvraag } from "./klantenportaalApi.js";

function numberOrEmpty(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

export default function KlantenportaalAanvraagModal({ open, onClose, onSubmitted }) {
  const [meta, setMeta] = useState({ bandTypes: [], uitvoeringen: [], Aansluitingen: [] });
  const [formValues, setFormValues] = useState({
    project_naam: "",
    band_type_id: "",
    uitvoering_type_id: "",
    Aansluiting_type_id: "",
    invoer_vermogen_w: "",
    invoer_snelheid_ms: "",
    trommellengte_mm: "",
    olie_voorkeur: "",
    opmerkingen: "",
  });
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [selectionRows, setSelectionRows] = useState([]);
  const previewRequestSeq = useRef(0);

  const topMatch = useMemo(() => selectionRows.find((item) => Number(item.volgorde) === 1) || selectionRows[0] || null, [selectionRows]);

  useEffect(() => {
    if (!open) return;
    setLoadingMeta(true);
    setSaveError("");
    setSaveSuccess("");
    setPreviewError("");
    setSelectionRows([]);
    setFormValues({
      project_naam: "",
      band_type_id: "",
      uitvoering_type_id: "",
      Aansluiting_type_id: "",
      invoer_vermogen_w: "",
      invoer_snelheid_ms: "",
      trommellengte_mm: "",
      olie_voorkeur: "",
      opmerkingen: "",
    });
    fetchKlantMeta()
      .then(setMeta)
      .catch(() => setMeta({ bandTypes: [], uitvoeringen: [], Aansluitingen: [] }))
      .finally(() => setLoadingMeta(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const hasRequiredInputs = Boolean(formValues.band_type_id) && Boolean(formValues.uitvoering_type_id);
    if (!hasRequiredInputs) {
      setSelectionRows([]);
      setPreviewError("");
      setPreviewBusy(false);
      return;
    }

    const timer = setTimeout(async () => {
      const requestId = ++previewRequestSeq.current;
      setPreviewBusy(true);
      setPreviewError("");
      try {
        const response = await previewKlantAanvraag(formValues);
        if (requestId !== previewRequestSeq.current) return;
        setSelectionRows(response?.resultaten || []);
      } catch {
        if (requestId !== previewRequestSeq.current) return;
        setPreviewError("Preview ophalen mislukt.");
      } finally {
        if (requestId === previewRequestSeq.current) setPreviewBusy(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [open, formValues]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setSaveSuccess("");
  };

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const response = await createKlantAanvraag(formValues);
      setSelectionRows(response?.resultaten || []);
      setSaveSuccess("Aanvraag opgeslagen.");
      if (typeof onSubmitted === "function") onSubmitted(response);
    } catch {
      setSaveError("Aanvraag versturen mislukt. Controleer je invoer en probeer opnieuw.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card klantenportaal-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Nieuwe aanvraag</div>
          <button className="btn btn-secondary btn-sm" type="button" onClick={onClose}>
            Sluiten
          </button>
        </div>

        <form onSubmit={handleSubmit} className="klp-form">
          <section className="klp-form-section">
            <h4>Product</h4>
            <div className="klp-form-grid">
              <label className="form-label">
                Projectnaam
                <input className="form-control" name="project_naam" value={formValues.project_naam} onChange={handleFieldChange} required />
              </label>
              <label className="form-label">
                Band type
                <select
                  className="form-control"
                  name="band_type_id"
                  value={formValues.band_type_id}
                  onChange={handleFieldChange}
                  required
                  disabled={loadingMeta}
                >
                  <option value="">Selecteer...</option>
                  {meta.bandTypes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.naam}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-label">
                Uitvoering
                <select
                  className="form-control"
                  name="uitvoering_type_id"
                  value={formValues.uitvoering_type_id}
                  onChange={handleFieldChange}
                  required
                  disabled={loadingMeta}
                >
                  <option value="">Selecteer...</option>
                  {meta.uitvoeringen.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.naam}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-label">
                Elektrische aansluiting
                <select
                  className="form-control"
                  name="Aansluiting_type_id"
                  value={formValues.Aansluiting_type_id}
                  onChange={handleFieldChange}
                  disabled={loadingMeta}
                >
                  <option value="">Geen voorkeur</option>
                  {meta.Aansluitingen.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.naam}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="klp-form-section">
            <h4>Proces</h4>
            <div className="klp-form-grid">
              <label className="form-label">
                Vermogen (W)
                <input
                  className="form-control"
                  name="invoer_vermogen_w"
                  type="number"
                  step="0.01"
                  value={formValues.invoer_vermogen_w}
                  onChange={handleFieldChange}
                />
              </label>
              <label className="form-label">
                Snelheid (m/s)
                <input
                  className="form-control"
                  name="invoer_snelheid_ms"
                  type="number"
                  step="0.0001"
                  value={formValues.invoer_snelheid_ms}
                  onChange={handleFieldChange}
                />
              </label>
              <label className="form-label">
                Trommellengte (mm)
                <input
                  className="form-control"
                  name="trommellengte_mm"
                  type="number"
                  step="1"
                  value={formValues.trommellengte_mm}
                  onChange={handleFieldChange}
                />
              </label>
              <label className="form-label">
                Smering
                <select className="form-control" name="olie_voorkeur" value={formValues.olie_voorkeur} onChange={handleFieldChange}>
                  <option value="">Geen voorkeur</option>
                  <option value="olievrij">Olievrij</option>
                  <option value="oliegevuld">Oliegevuld</option>
                </select>
              </label>
              <label className="form-label klp-full-width">
                Opmerking
                <textarea className="form-control" name="opmerkingen" rows={3} value={formValues.opmerkingen} onChange={handleFieldChange} />
              </label>
            </div>
          </section>

          <div className="klp-modal-actions">
            <button className="btn btn-primary" disabled={saving || loadingMeta} type="submit">
              {saving ? "Versturen..." : "Aanvraag versturen"}
            </button>
            {saveError && <span className="klp-error">{saveError}</span>}
            {saveSuccess && <span>{saveSuccess}</span>}
          </div>
        </form>

        <section className="klp-form-section klp-result-section">
          <h4>Resultaat</h4>
          {previewBusy ? <p className="text-secondary">Resultaat wordt bijgewerkt...</p> : null}
          {previewError ? <p className="klp-error">{previewError}</p> : null}
          {topMatch ? (
            <div className="klp-topmatch">
              <strong>Topmatch:</strong>{" "}
              {topMatch.leverancier_naam} {topMatch.motortype_code} | {numberOrEmpty(topMatch.netto_snelheid_ms ?? topMatch.snelheid_ms)} m/s | score {numberOrEmpty(topMatch.ranking_score)}
            </div>
          ) : (
            <p className="text-secondary">Nog geen selectie-resultaten voor deze sessie.</p>
          )}
          <div className="table-container klp-result-table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Leverancier</th>
                  <th>Motortype</th>
                  <th>Vermogen</th>
                  <th>Netto snelheid</th>
                  <th>Delta %</th>
                  <th>PCD</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {selectionRows.map((item) => (
                  <tr key={`${item.motor_spec_id}-${item.volgorde}`}>
                    <td>{numberOrEmpty(item.volgorde)}</td>
                    <td>{item.leverancier_naam}</td>
                    <td>{item.motortype_code}</td>
                    <td>{numberOrEmpty(item.vermogen_w)}</td>
                    <td>{numberOrEmpty(item.netto_snelheid_ms ?? item.snelheid_ms)}</td>
                    <td>{numberOrEmpty(item.snelheid_delta_pct) || "-"}</td>
                    <td>{numberOrEmpty(item.pcd_mm) || "-"}</td>
                    <td>{numberOrEmpty(item.ranking_score)}</td>
                  </tr>
                ))}
                {!selectionRows.length && (
                  <tr>
                    <td colSpan={8}>Nog geen selectie-resultaten.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
