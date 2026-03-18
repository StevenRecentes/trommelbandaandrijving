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
  { key: "leveranciers", label: "Leveranciers" },
  { key: "uitvoeringen", label: "Uitvoering types" },
  { key: "Aansluitingen", label: "Aansluiting types" },
];

export default function GegevensLeveranciers() {
  const [activeTab, setActiveTab] = useState("leveranciers");
  const [leveranciers, setLeveranciers] = useState([]);
  const [uitvoeringen, setUitvoeringen] = useState([]);
  const [Aansluitingen, setAansluitingen] = useState([]);
  const [modal, setModal] = useState({ type: null, data: null });

  const refresh = async () => {
    const [l, u, a] = await Promise.all([
      getJson("/gegevens/leveranciers"),
      getJson("/gegevens/uitvoering-types"),
      getJson("/gegevens/Aansluiting-types"),
    ]);
    setLeveranciers(l || []);
    setUitvoeringen(u || []);
    setAansluitingen(a || []);
  };

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  useEffect(() => {
    window.editLeverancier = (id, row) => setModal({ type: "leveranciers", data: { id, ...row } });
    window.deleteLeverancier = (id) => handleDelete("leveranciers", id);
    window.editUitvoering = (id, row) => setModal({ type: "uitvoeringen", data: { id, ...row } });
    window.deleteUitvoering = (id) => handleDelete("uitvoeringen", id);
    window.editAansluiting = (id, row) => setModal({ type: "Aansluitingen", data: { id, ...row } });
    window.deleteAansluiting = (id) => handleDelete("Aansluitingen", id);
  }, []);

  const handleDelete = async (type, id) => {
    if (!window.confirm("Weet je zeker dat je dit wilt verwijderen?")) return;
    const map = {
      leveranciers: "/gegevens/leveranciers",
      uitvoeringen: "/gegevens/uitvoering-types",
      Aansluitingen: "/gegevens/Aansluiting-types",
    };
    await deleteJson(`${map[type]}/${id}`);
    await refresh();
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.target).entries());
    payload.actief = payload.actief ? 1 : 0;
    const map = {
      leveranciers: "/gegevens/leveranciers",
      uitvoeringen: "/gegevens/uitvoering-types",
      Aansluitingen: "/gegevens/Aansluiting-types",
    };
    const base = map[modal.type];
    if (modal.data?.id) {
      await putJson(`${base}/${modal.data.id}`, payload);
    } else {
      await postJson(base, payload);
    }
    setModal({ type: null, data: null });
    await refresh();
  };

  const leveranciersColumns = useMemo(
    () => [
      { key: "naam", label: "Naam", sortable: true },
      { key: "actief", label: "Actief", sortable: true },
    ],
    []
  );
  const typeColumns = useMemo(
    () => [
      { key: "naam", label: "Naam", sortable: true },
      { key: "code", label: "Code", sortable: true },
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

      {activeTab === "leveranciers" && (
        <>
          <div className="inline-form" style={{ justifyContent: "space-between", marginBottom: 16 }}>
            <h3>Leveranciers</h3>
            <button className="btn btn-primary" onClick={() => setModal({ type: "leveranciers", data: null })}>
              Toevoegen
            </button>
          </div>
          <ClientTable
            tableId="leveranciersTable"
            title="Leveranciers"
            columns={leveranciersColumns}
            data={leveranciers}
            actions={[
              { type: "edit", onClick: "editLeverancier" },
              { type: "delete", onClick: "deleteLeverancier" },
            ]}
            enableColumnFilters
          />
        </>
      )}

      {activeTab === "uitvoeringen" && (
        <>
          <div className="inline-form" style={{ justifyContent: "space-between", marginBottom: 16 }}>
            <h3>Uitvoering types</h3>
            <button className="btn btn-primary" onClick={() => setModal({ type: "uitvoeringen", data: null })}>
              Toevoegen
            </button>
          </div>
          <ClientTable
            tableId="uitvoeringTable"
            title="Uitvoering types"
            columns={typeColumns}
            data={uitvoeringen}
            actions={[
              { type: "edit", onClick: "editUitvoering" },
              { type: "delete", onClick: "deleteUitvoering" },
            ]}
            enableColumnFilters
          />
        </>
      )}

      {activeTab === "Aansluitingen" && (
        <>
          <div className="inline-form" style={{ justifyContent: "space-between", marginBottom: 16 }}>
            <h3>Aansluiting types</h3>
            <button className="btn btn-primary" onClick={() => setModal({ type: "Aansluitingen", data: null })}>
              Toevoegen
            </button>
          </div>
          <ClientTable
            tableId="AansluitingTable"
            title="Aansluiting types"
            columns={typeColumns}
            data={Aansluitingen}
            actions={[
              { type: "edit", onClick: "editAansluiting" },
              { type: "delete", onClick: "deleteAansluiting" },
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
        <label className="form-label">Naam</label>
        <input className="form-control" name="naam" defaultValue={modal.data?.naam || ""} required autoFocus />
        {modal.type !== "leveranciers" && (
          <>
            <label className="form-label" style={{ marginTop: 10 }}>
              Code
            </label>
            <input className="form-control" name="code" defaultValue={modal.data?.code || ""} />
          </>
        )}
        <label style={{ display: "block", marginTop: 12 }}>
          <input type="checkbox" name="actief" defaultChecked={modal.data ? Boolean(modal.data.actief) : true} /> Actief
        </label>
      </Modal>
    </div>
  );
}
