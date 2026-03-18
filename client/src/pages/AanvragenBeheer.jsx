import { useEffect, useMemo, useState } from "react";
import ClientTable from "../components/ClientTable.jsx";
import { getJson, putJson } from "../api.js";

function DetailModal({ open, onClose, aanvraag }) {
  if (!open || !aanvraag) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Aanvraag #{aanvraag.id}</div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Sluiten
          </button>
        </div>
        <div style={{ maxHeight: "65vh", overflow: "auto" }}>
          <p>
            <strong>Project:</strong> {aanvraag.project_naam || "-"}
          </p>
          <p>
            <strong>Klant:</strong> {aanvraag.bedrijfsnaam || "-"} ({aanvraag.klant_email || "-"})
          </p>
          <p>
            <strong>Status:</strong> {aanvraag.status}
          </p>
          <p>
            <strong>Band / Uitvoering:</strong> {aanvraag.band_type_naam || "-"} / {aanvraag.uitvoering_naam || "-"}
          </p>
          <h4>Resultaten</h4>
          <ul>
            {(aanvraag.regels || []).map((regel) => (
              <li key={regel.id}>
                {regel.leverancier_naam} - {regel.motortype_code} ({regel.vermogen_w} W, {regel.snelheid_ms} m/s)
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function AanvragenBeheer() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);

  const refresh = async () => {
    const data = await getJson("/aanvragen");
    setRows(data || []);
  };

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  useEffect(() => {
    window.viewAanvraag = async (id) => {
      const detail = await getJson(`/aanvragen/${id}`);
      setSelected(detail);
    };
    window.markAanvraagInBehandeling = async (id) => {
      await putJson(`/aanvragen/${id}/status`, { status: "in_behandeling" });
      await refresh();
    };
    window.markAanvraagOfferteVerzonden = async (id) => {
      await putJson(`/aanvragen/${id}/status`, { status: "offerte_verzonden" });
      await refresh();
    };
  }, []);

  const columns = useMemo(
    () => [
      { key: "id", label: "Id", sortable: true },
      { key: "status", label: "Status", sortable: true },
      { key: "project_naam", label: "Project", sortable: true },
      { key: "bedrijfsnaam", label: "Bedrijf", sortable: true },
      { key: "band_type_naam", label: "Band", sortable: true },
      { key: "invoer_vermogen_w", label: "Vermogen [W]", sortable: true },
      { key: "invoer_snelheid_ms", label: "Snelheid [m/s]", sortable: true },
      { key: "aangemaakt_op", label: "Aangemaakt", sortable: true },
    ],
    []
  );

  return (
    <div className="page-container">
      <ClientTable
        tableId="aanvragenBeheerTable"
        title="Aanvragen beheer"
        columns={columns}
        data={rows}
        actions={[
          { type: "view", onClick: "viewAanvraag" },
          { type: "custom", label: "In behandeling", onClick: "markAanvraagInBehandeling" },
          { type: "custom", label: "Offerte verzonden", onClick: "markAanvraagOfferteVerzonden" },
        ]}
        enableColumnFilters
        exportEnabled
      />
      <DetailModal open={Boolean(selected)} aanvraag={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
