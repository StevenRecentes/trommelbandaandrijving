const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

function ensureOutputDir() {
  const outputDir = path.resolve(__dirname, "..", "..", "generated", "aanvragen");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return outputDir;
}

function renderRow(doc, label, value) {
  doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
  doc.font("Helvetica").text(value ?? "-");
}

async function generateAanvraagPdf({ aanvraag, regels = [] }) {
  const outputDir = ensureOutputDir();
  const filename = `aanvraag-${aanvraag.id}.pdf`;
  const absolutePath = path.join(outputDir, filename);

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(absolutePath);
    doc.pipe(stream);

    doc.fontSize(18).font("Helvetica-Bold").text("Trommelmotor Selectie Aanvraag");
    doc.moveDown();

    renderRow(doc, "Aanvraag ID", String(aanvraag.id));
    renderRow(doc, "Status", aanvraag.status);
    renderRow(doc, "Project", aanvraag.project_naam);
    renderRow(doc, "Bedrijf", aanvraag.bedrijfsnaam);
    renderRow(doc, "Contact", aanvraag.contactpersoon_naam);
    renderRow(doc, "E-mail", aanvraag.klant_email);
    renderRow(doc, "Band", aanvraag.band_type_naam);
    renderRow(doc, "Uitvoering", aanvraag.uitvoering_naam);
    renderRow(doc, "Aansluiting", aanvraag.Aansluiting_naam);
    renderRow(doc, "Vermogen (W)", aanvraag.invoer_vermogen_w);
    renderRow(doc, "Snelheid (m/s)", aanvraag.invoer_snelheid_ms);
    renderRow(doc, "Olie voorkeur", aanvraag.olie_voorkeur);
    renderRow(doc, "Aangemaakt", aanvraag.aangemaakt_op);
    doc.moveDown();

    doc.font("Helvetica-Bold").text("Selectieresultaten");
    doc.moveDown(0.5);
    if (!regels.length) {
      doc.font("Helvetica").text("Geen selectieresultaten beschikbaar.");
    } else {
      regels.forEach((regel, index) => {
        doc.font("Helvetica-Bold").text(`#${index + 1} ${regel.leverancier_naam} - ${regel.motortype_code}`);
        doc.font("Helvetica").text(
          `Vermogen: ${regel.vermogen_w} W | Snelheid: ${regel.snelheid_ms} m/s | Score: ${regel.ranking_score}`
        );
        doc.moveDown(0.3);
      });
    }

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return { absolutePath, filename };
}

module.exports = {
  generateAanvraagPdf,
};
