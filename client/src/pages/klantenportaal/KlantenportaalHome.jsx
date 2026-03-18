import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import KlantenportaalAanvraagModal from "./KlantenportaalAanvraagModal.jsx";
import { fetchKlantOverzicht, markStatusUpdatesSeen } from "./klantenportaalApi.js";

export default function KlantenportaalHome() {
  const [overzicht, setOverzicht] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAanvraagModal, setShowAanvraagModal] = useState(false);
  const [markingSeen, setMarkingSeen] = useState(false);

  const refresh = async () => {
    const data = await fetchKlantOverzicht();
    setOverzicht(data || null);
  };

  useEffect(() => {
    setLoading(true);
    refresh()
      .catch(() => setOverzicht(null))
      .finally(() => setLoading(false));
  }, []);

  const totals = overzicht?.totals || { totaal: 0, lopend: 0, afgerond: 0, ongelezen_status_updates: 0 };
  const latestRows = overzicht?.laatste || [];
  const hasUnseen = Number(totals.ongelezen_status_updates || 0) > 0;

  const lastSeenText = useMemo(() => {
    const iso = overzicht?.status_tracking?.laatste_status_gezien_op;
    if (!iso) return "Nog niet gemarkeerd";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "Onbekend";
    return date.toLocaleString("nl-NL");
  }, [overzicht?.status_tracking?.laatste_status_gezien_op]);

  const handleMarkSeen = async () => {
    setMarkingSeen(true);
    try {
      await markStatusUpdatesSeen();
      await refresh();
    } finally {
      setMarkingSeen(false);
    }
  };

  return (
    <div className="page-container klantenportaal-page">
      <div className="klp-hero card">
        <div className="card-body">
          <div className="klp-hero-top">
            <div>
              <h2>Klantenportaal Home</h2>
              <p className="text-secondary">Overzicht van lopende aanvragen en recente statuswijzigingen.</p>
            </div>
            <div className="klp-hero-actions">
              <button className="btn btn-primary" type="button" onClick={() => setShowAanvraagModal(true)}>
                Nieuwe aanvraag
              </button>
              <Link className="btn btn-secondary" to="/klantenportaal/aanvragen/mijn">
                Mijn aanvragen
              </Link>
            </div>
          </div>

          <div className="klp-stat-grid">
            <article className="klp-stat-card">
              <span>Totaal</span>
              <strong>{totals.totaal}</strong>
            </article>
            <article className="klp-stat-card">
              <span>Lopend</span>
              <strong>{totals.lopend}</strong>
            </article>
            <article className="klp-stat-card">
              <span>Afgerond</span>
              <strong>{totals.afgerond}</strong>
            </article>
            <article className={`klp-stat-card ${hasUnseen ? "has-unseen" : ""}`}>
              <span>Nieuwe updates</span>
              <strong>{totals.ongelezen_status_updates}</strong>
            </article>
          </div>

          <div className="klp-seen-row">
            <span className="text-secondary">Laatst gezien: {lastSeenText}</span>
            <button className="btn btn-secondary btn-sm" type="button" disabled={markingSeen} onClick={handleMarkSeen}>
              {markingSeen ? "Bijwerken..." : "Markeer als gezien"}
            </button>
          </div>
        </div>
      </div>

      <div className="card klp-table-card">
        <div className="card-body">
          <h3>Laatste 5 aanvragen</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Project</th>
                  <th>Band</th>
                  <th>Uitvoering</th>
                  <th>Bijgewerkt</th>
                </tr>
              </thead>
              <tbody>
                {latestRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>
                      <span className="status-pill">{row.status}</span>
                    </td>
                    <td>{row.project_naam || "-"}</td>
                    <td>{row.band_type_naam || "-"}</td>
                    <td>{row.uitvoering_naam || "-"}</td>
                    <td>{row.bijgewerkt_op || row.aangemaakt_op || "-"}</td>
                  </tr>
                ))}
                {!latestRows.length && !loading && (
                  <tr>
                    <td colSpan={6}>Nog geen aanvragen gevonden.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <KlantenportaalAanvraagModal
        open={showAanvraagModal}
        onClose={() => setShowAanvraagModal(false)}
        onSubmitted={() => {
          refresh().catch(() => {});
        }}
      />
    </div>
  );
}
