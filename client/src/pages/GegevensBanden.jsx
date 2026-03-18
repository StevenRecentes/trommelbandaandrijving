import { useEffect, useMemo, useState } from "react";
import ClientTable from "../components/ClientTable.jsx";
import { deleteJson, getJson, postJson, putJson } from "../api.js";

function Modal({ open, title, onClose, onSubmit, children }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Sluiten
          </button>
        </div>
        <form onSubmit={onSubmit}>
          {children}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annuleren
            </button>
            <button type="submit" className="btn btn-primary">
              Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const TABS = [
  { key: "bandtypes", label: "Band types" },
  { key: "compat", label: "Compatibiliteit" },
];

export default function GegevensBanden() {
  const [activeTab, setActiveTab] = useState("bandtypes");
  const [bandTypes, setBandTypes] = useState([]);
  const [compat, setCompat] = useState([]);
  const [uitvoeringen, setUitvoeringen] = useState([]);
  const [motortypes, setMotortypes] = useState([]);
  const [modal, setModal] = useState({ type: null, data: null });

  const refresh = async () => {
    const [b, c, u, m] = await Promise.all([
      getJson("/gegevens/band-types"),
      getJson("/gegevens/band-compat"),
      getJson("/gegevens/uitvoering-types"),
      getJson("/gegevens/motortypes"),
    ]);
    setBandTypes(b || []);
    setCompat(c || []);
    setUitvoeringen(u || []);
    setMotortypes(m || []);
  };

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  useEffect(() => {
    window.editBandType = (id, row) => setModal({ type: "bandtypes", data: { id, ...row } });
    window.deleteBandType = (id) => handleDelete("bandtypes", id);
    window.editCompat = (id, row) => setModal({ type: "compat", data: { id, ...row } });
    window.deleteCompat = (id) => handleDelete("compat", id);
  }, []);

  const handleDelete = async (type, id) => {
    if (!window.confirm("Weet je zeker dat je dit wilt verwijderen?")) return;
    const map = { bandtypes: "/gegevens/band-types", compat: "/gegevens/band-compat" };
    await deleteJson(`${map[type]}/${id}`);
    await refresh();
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.target).entries());
    payload.actief = payload.actief ? 1 : 0;
    if (modal.type === "bandtypes") {
      const wrijvingsfactorRaw = payload.wrijvingsfactor;
      if (wrijvingsfactorRaw !== undefined) {
        payload.wrijvingscoeff_rvs_droog = wrijvingsfactorRaw;
        payload.wrijvingscoeff_rvs_nat = wrijvingsfactorRaw;
        delete payload.wrijvingsfactor;
      }
    }
    const map = { bandtypes: "/gegevens/band-types", compat: "/gegevens/band-compat" };
    const base = map[modal.type];
    if (modal.data?.id) await putJson(`${base}/${modal.data.id}`, payload);
    else await postJson(base, payload);
    setModal({ type: null, data: null });
    await refresh();
  };

  const bandColumns = useMemo(
    () => [
      { key: "naam", label: "Naam", sortable: true },
      { key: "steek_mm", label: "Steek [mm]", sortable: true },
      { key: "dikte_band_mm", label: "Dikte band [mm]", sortable: true },
      { key: "wrijvingscoeff_rvs_droog", label: "Wrijvingsfactor", sortable: true },
      { key: "actief", label: "Actief", sortable: true },
    ],
    []
  );
  const compatColumns = useMemo(
    () => [
      { key: "band_type_naam", label: "Band", sortable: true },
      { key: "uitvoering_naam", label: "Uitvoering", sortable: true },
      { key: "leverancier_naam", label: "Leverancier", sortable: true },
      { key: "motortype_code", label: "Motortype", sortable: true },
      { key: "tandenaantal", label: "Tanden", sortable: true },
      { key: "pcd_mm", label: "PCD [mm]", sortable: true },
      { key: "actief", label: "Actief", sortable: true },
    ],
    []
  );

  return (
    <div className="page-container">
      <div className="tab-row">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-button ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "bandtypes" && (
        <>
          <div className="inline-form" style={{ justifyContent: "space-between", marginBottom: 16 }}>
            <h3>Band types</h3>
            <button className="btn btn-primary" onClick={() => setModal({ type: "bandtypes", data: null })}>
              Toevoegen
            </button>
          </div>
          <ClientTable
            tableId="bandTypesTable"
            title="Band types"
            columns={bandColumns}
            data={bandTypes}
            actions={[
              { type: "edit", onClick: "editBandType" },
              { type: "delete", onClick: "deleteBandType" },
            ]}
            enableColumnFilters
          />
        </>
      )}

      {activeTab === "compat" && (
        <>
          <div className="inline-form" style={{ justifyContent: "space-between", marginBottom: 16 }}>
            <h3>Band compatibiliteit</h3>
            <button className="btn btn-primary" onClick={() => setModal({ type: "compat", data: null })}>
              Toevoegen
            </button>
          </div>
          <ClientTable
            tableId="bandCompatTable"
            title="Band compatibiliteit"
            columns={compatColumns}
            data={compat}
            actions={[
              { type: "edit", onClick: "editCompat" },
              { type: "delete", onClick: "deleteCompat" },
            ]}
            enableColumnFilters
          />
        </>
      )}

      <Modal
        open={Boolean(modal.type)}
        title={modal.data?.id ? "Bewerk item" : "Nieuw item"}
        onClose={() => setModal({ type: null, data: null })}
        onSubmit={handleSave}
      >
        {modal.type === "bandtypes" && (
          <>
            <label className="form-label">Naam</label>
            <input className="form-control" name="naam" defaultValue={modal.data?.naam || ""} required />
            <label className="form-label" style={{ marginTop: 10 }}>
              Steek (mm)
            </label>
            <input
              className="form-control"
              type="number"
              step="0.01"
              name="steek_mm"
              defaultValue={modal.data?.steek_mm || ""}
            />
            <label className="form-label" style={{ marginTop: 10 }}>
              Dikte band (mm)
            </label>
            <input
              className="form-control"
              type="number"
              step="0.01"
              name="dikte_band_mm"
              defaultValue={modal.data?.dikte_band_mm || ""}
            />
            <label className="form-label" style={{ marginTop: 10 }}>
              Wrijvingsfactor (0 t/m 1)
            </label>
            <input
              className="form-control"
              type="number"
              step="0.01"
              min="0"
              max="1"
              name="wrijvingsfactor"
              defaultValue={modal.data?.wrijvingscoeff_rvs_droog ?? modal.data?.wrijvingscoeff_rvs_nat ?? ""}
            />
          </>
        )}
        {modal.type === "compat" && (
          <>
            <label className="form-label">Band type</label>
            <select className="form-control" name="band_type_id" defaultValue={modal.data?.band_type_id || ""} required>
              <option value="">Selecteer...</option>
              {bandTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.naam}
                </option>
              ))}
            </select>
            <label className="form-label" style={{ marginTop: 10 }}>
              Uitvoering
            </label>
            <select
              className="form-control"
              name="uitvoering_type_id"
              defaultValue={modal.data?.uitvoering_type_id || ""}
              required
            >
              <option value="">Selecteer...</option>
              {uitvoeringen.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.naam}
                </option>
              ))}
            </select>
            <label className="form-label" style={{ marginTop: 10 }}>
              Motortype
            </label>
            <select className="form-control" name="motortype_id" defaultValue={modal.data?.motortype_id || ""} required>
              <option value="">Selecteer...</option>
              {motortypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.leverancier_naam} - {item.code}
                </option>
              ))}
            </select>
          </>
        )}
        <label style={{ display: "block", marginTop: 12 }}>
          <input type="checkbox" name="actief" defaultChecked={modal.data ? Boolean(modal.data.actief) : true} /> Actief
        </label>
      </Modal>
    </div>
  );
}
