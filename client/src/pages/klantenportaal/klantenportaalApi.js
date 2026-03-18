import { getJson, postJson } from "../../api.js";

export async function fetchKlantMeta() {
  const [bandTypes, uitvoeringen, Aansluitingen] = await Promise.all([
    getJson("/klantenportaal/meta/band-types"),
    getJson("/klantenportaal/meta/uitvoering-types"),
    getJson("/klantenportaal/meta/Aansluiting-types"),
  ]);
  return {
    bandTypes: bandTypes || [],
    uitvoeringen: uitvoeringen || [],
    Aansluitingen: Aansluitingen || [],
  };
}

export function fetchKlantAanvragen() {
  return getJson("/klantenportaal/aanvragen");
}

export function fetchKlantOverzicht() {
  return getJson("/klantenportaal/aanvragen/overzicht");
}

export function markStatusUpdatesSeen() {
  return postJson("/klantenportaal/aanvragen/status-updates/seen", {});
}

export function createKlantAanvraag(payload) {
  return postJson("/klantenportaal/aanvragen", payload);
}

export function previewKlantAanvraag(payload) {
  return postJson("/klantenportaal/aanvragen/preview", payload);
}

export function finalizeKlantAanvraag(id) {
  return postJson(`/klantenportaal/aanvragen/${id}/definitief`, {});
}
