import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import KlantenportaalAanvraagModal from "./KlantenportaalAanvraagModal.jsx";
import { fetchKlantAanvragen, finalizeKlantAanvraag } from "./klantenportaalApi.js";

export default function KlantenportaalMijnAanvragen() {
  const [aanvragen, setAanvragen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [finalizingId, setFinalizingId] = useState(0);
  const [showAanvraagModal, setShowAanvraagModal] = useState(false);

  const refresh = async () => {
    const rows = await fetchKlantAanvragen();
    setAanvragen(rows || []);
  };

  useEffect(() => {
    setLoading(true);
    refresh()
      .catch(() => setAanvragen([]))
      .finally(() => setLoading(false));
  }, []);

  const handleFinalize = async (id) => {
    setFinalizingId(id);
    try {
      await finalizeKlantAanvraag(id);
      await refresh();
    } finally {
      setFinalizingId(0);
    }
  };

  return (
    <div className="page-container klantenportaal-page">
      <div className="card">
        <div className="card-body">
          <div className="klp-hero-top">
            <div>
              <h2>Mijn aanvragen</h2>
              <p className="text-secondary">Alle klantaanvragen met status en vervolgstappen.</p>
            </div>
            <div className="klp-hero-actions">
              <button className="btn btn-primary" type="button" onClick={() => setShowAanvraagModal(true)}>
                Nieuwe aanvraag
              </button>
              <Link className="btn btn-secondary" to="/klantenportaal/aanvragen">
                Naar home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="card klp-table-card">
        <div className="card-body">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Project</th>
                  <th>Band</th>
                  <th>Uitvoering</th>
                  <th>Aangemaakt</th>
                  <th>Actie</th>
                </tr>
              </thead>
              <tbody>
                {aanvragen.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>
                      <span className="status-pill">{row.status}</span>
                    </td>
                    <td>{row.project_naam || "-"}</td>
                    <td>{row.band_type_naam || "-"}</td>
                    <td>{row.uitvoering_naam || "-"}</td>
                    <td>{row.aangemaakt_op || "-"}</td>
                    <td>
                      {row.status !== "definitief" ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          disabled={finalizingId === row.id}
                          onClick={() => handleFinalize(row.id)}
                        >
                          {finalizingId === row.id ? "Bezig..." : "Definitief maken"}
                        </button>
                      ) : (
                        "Definitief"
                      )}
                    </td>
                  </tr>
                ))}
                {!aanvragen.length && !loading && (
                  <tr>
                    <td colSpan={7}>Nog geen aanvragen.</td>
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
