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
  { key: "motortypes", label: "Motortypes" },
  { key: "motorspecs", label: "Motor specs" },
];

export default function GegevensMotors() {
  const [activeTab, setActiveTab] = useState("motortypes");
  const [leveranciers, setLeveranciers] = useState([]);
  const [motortypes, setMotortypes] = useState([]);
  const [Aansluitingen, setAansluitingen] = useState([]);
  const [motorSpecs, setMotorSpecs] = useState([]);
  const [modal, setModal] = useState({ type: null, data: null });
  const [importBusy, setImportBusy] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  const refresh = async () => {
    const [l, mt, a, ms] = await Promise.allSettled([
      getJson("/gegevens/motor-leveranciers"),
      getJson("/gegevens/motortypes"),
      getJson("/gegevens/motor-Aansluiting-types"),
      getJson("/gegevens/motor-specs"),
    ]);
    setLeveranciers(l.status === "fulfilled" ? l.value || [] : []);
    setMotortypes(mt.status === "fulfilled" ? mt.value || [] : []);
    setAansluitingen(a.status === "fulfilled" ? a.value || [] : []);
    setMotorSpecs(ms.status === "fulfilled" ? ms.value || [] : []);
  };

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  useEffect(() => {
    window.editMotortype = (id, row) => setModal({ type: "motortypes", data: { id, ...row } });
    window.deleteMotortype = (id) => handleDelete("motortypes", id);
    window.editMotorSpec = (id, row) => setModal({ type: "motorspecs", data: { id, ...row } });
    window.deleteMotorSpec = (id) => handleDelete("motorspecs", id);
  }, []);

  const handleDelete = async (type, id) => {
    if (!window.confirm("Weet je zeker dat je dit wilt verwijderen?")) return;
    const map = { motortypes: "/gegevens/motortypes", motorspecs: "/gegevens/motor-specs" };
    await deleteJson(`${map[type]}/${id}`);
    await refresh();
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.target).entries());
    payload.actief = payload.actief ? 1 : 0;
    const map = { motortypes: "/gegevens/motortypes", motorspecs: "/gegevens/motor-specs" };
    const base = map[modal.type];
    if (modal.data?.id) await putJson(`${base}/${modal.data.id}`, payload);
    else await postJson(base, payload);
    setModal({ type: null, data: null });
    await refresh();
  };

  const runImport = async (dryRun) => {
    setImportBusy(true);
    setImportMessage("");
    try {
      const payload = { dry_run: dryRun };
      if (!dryRun) payload.confirm = "IMPORT_AMMDRIVE";
      const response = await postJson("/admin/ammdrive-import", payload);
      const result = response?.result || {};
      setImportMessage(
        `${dryRun ? "Dry-run" : "Import"} gereed: specs=${result.motor_specs || 0}, compat=${result.compatibiliteit || 0}`
      );
      await refresh();
    } catch (error) {
      setImportMessage(`Import mislukt: ${error?.message || "onbekende fout"}`);
    } finally {
      setImportBusy(false);
    }
  };

  const motortypeColumns = useMemo(
    () => [
      { key: "leverancier_naam", label: "Leverancier", sortable: true },
      { key: "code", label: "Code", sortable: true },
      { key: "diameter_nominaal_mm", label: "Dnom [mm]", sortable: true },
      { key: "actief", label: "Actief", sortable: true },
    ],
    []
  );

  const motorSpecColumns = useMemo(
    () => [
      { key: "leverancier_naam", label: "Leverancier", sortable: true },
      { key: "motortype_code", label: "Motortype", sortable: true },
      { key: "vermogen_w", label: "Vermogen [W]", sortable: true },
      { key: "snelheid_ms", label: "Snelheid [m/s]", sortable: true },
      { key: "Aansluiting_naam", label: "Aansluiting", sortable: true },
      { key: "olie_type", label: "Olie", sortable: true },
      { key: "actief", label: "Actief", sortable: true },
    ],
    []
  );

  return (
    <div className="page-container">
      <div className="inline-form" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <h3>Ammdrive import</h3>
        <div className="inline-form">
          <button type="button" className="btn btn-secondary" disabled={importBusy} onClick={() => runImport(true)}>
            Dry-run
          </button>
          <button type="button" className="btn btn-primary" disabled={importBusy} onClick={() => runImport(false)}>
            Herimport
          </button>
        </div>
      </div>
      {importMessage ? <div style={{ marginBottom: 16 }}>{importMessage}</div> : null}

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

      {activeTab === "motortypes" && (
        <>
          <div className="inline-form" style={{ justifyContent: "space-between", marginBottom: 16 }}>
            <h3>Motortypes</h3>
            <button className="btn btn-primary" onClick={() => setModal({ type: "motortypes", data: null })}>
              Toevoegen
            </button>
          </div>
          <ClientTable
            tableId="motortypeTable"
            title="Motortypes"
            columns={motortypeColumns}
            data={motortypes}
            actions={[
              { type: "edit", onClick: "editMotortype" },
              { type: "delete", onClick: "deleteMotortype" },
            ]}
            enableColumnFilters
          />
        </>
      )}

      {activeTab === "motorspecs" && (
        <>
          <div className="inline-form" style={{ justifyContent: "space-between", marginBottom: 16 }}>
            <h3>Motor specs</h3>
            <button className="btn btn-primary" onClick={() => setModal({ type: "motorspecs", data: null })}>
              Toevoegen
            </button>
          </div>
          <ClientTable
            tableId="motorSpecTable"
            title="Motor specs"
            columns={motorSpecColumns}
            data={motorSpecs}
            actions={[
              { type: "edit", onClick: "editMotorSpec" },
              { type: "delete", onClick: "deleteMotorSpec" },
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
        {modal.type === "motortypes" && (
          <>
            <label className="form-label">Leverancier</label>
            <select className="form-control" name="leverancier_id" defaultValue={modal.data?.leverancier_id || ""} required>
              <option value="">Selecteer...</option>
              {leveranciers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.naam}
                </option>
              ))}
            </select>
            <label className="form-label" style={{ marginTop: 10 }}>
              Code
            </label>
            <input className="form-control" name="code" defaultValue={modal.data?.code || ""} required />
            <label className="form-label" style={{ marginTop: 10 }}>
              Diameter nominaal (mm)
            </label>
            <input className="form-control" name="diameter_nominaal_mm" defaultValue={modal.data?.diameter_nominaal_mm || ""} />
          </>
        )}
        {modal.type === "motorspecs" && (
          <>
            <label className="form-label">Motortype</label>
            <select className="form-control" name="motortype_id" defaultValue={modal.data?.motortype_id || ""} required>
              <option value="">Selecteer...</option>
              {motortypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.leverancier_naam} - {item.code}
                </option>
              ))}
            </select>
            <label className="form-label" style={{ marginTop: 10 }}>
              Vermogen (W)
            </label>
            <input className="form-control" type="number" step="0.01" name="vermogen_w" defaultValue={modal.data?.vermogen_w || ""} required />
            <label className="form-label" style={{ marginTop: 10 }}>
              Snelheid (m/s)
            </label>
            <input className="form-control" type="number" step="0.0001" name="snelheid_ms" defaultValue={modal.data?.snelheid_ms || ""} required />
            <label className="form-label" style={{ marginTop: 10 }}>
              Aansluitingstype
            </label>
            <select className="form-control" name="Aansluiting_type_id" defaultValue={modal.data?.Aansluiting_type_id || ""}>
              <option value="">Geen voorkeur</option>
              {Aansluitingen.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.naam}
                </option>
              ))}
            </select>
            <label className="form-label" style={{ marginTop: 10 }}>
              Olie type
            </label>
            <input className="form-control" name="olie_type" defaultValue={modal.data?.olie_type || "onbekend"} />
          </>
        )}
        <label style={{ display: "block", marginTop: 12 }}>
          <input type="checkbox" name="actief" defaultChecked={modal.data ? Boolean(modal.data.actief) : true} /> Actief
        </label>
      </Modal>
    </div>
  );
}
