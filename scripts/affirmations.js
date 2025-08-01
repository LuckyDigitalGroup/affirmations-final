console.log("✅ affirmations.js is loaded");

function getSelectedAffirmations() {
  const selected = JSON.parse(localStorage.getItem("selectedAffirmations")) || {};
  const output = [];

  for (const section in selected) {
    const sectionData = selected[section];

    for (const type in sectionData) {
      const selection = sectionData[type];

      if (!selection || !selection.text) continue;

      const sentence = selection.text;
      const highlightWord = selection.highlight || "";

      // Escape regex-sensitive characters from highlight word
      const escapedWord = highlightWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      // Only apply highlighting if a word is provided
      const regex = escapedWord
        ? new RegExp(`\\b(${escapedWord})\\b`, "gi")
        : null;

      const highlighted = regex
        ? sentence.replace(regex, match => `<span class="highlight">${match}</span>`)
        : sentence;

      output.push(highlighted);
    }
  }

  return output;
}

function renderOutput() {
  const container = document.getElementById("final-output");
  const affirmations = getSelectedAffirmations();

  if (affirmations.length === 0) {
    container.innerHTML = "<p>No affirmations selected yet.</p>";
    return;
  }

  container.innerHTML = affirmations
    .map(text => `<div class="output-affirmation">${text}</div>`)
    .join("");
}

function generateDownloadText() {
  const selected = JSON.parse(localStorage.getItem("selectedAffirmations")) || {};
  let result = "Your Final Affirmations:\n\n";

  for (const section in selected) {
    for (const type in selected[section]) {
      const { trait, text } = selected[section][type];
      result += `• [${trait}] ${text}\n`;
    }
  }

  return result;
}

document.addEventListener("DOMContentLoaded", () => {
  const bar = document.getElementById("progress-bar-fill");
  if (bar) {
    bar.style.width = "100%";
  }

  renderOutput();

document.getElementById("download-btn").addEventListener("click", async () => {
  const affirmations = getSelectedAffirmations();

  // Create styled HTML structure for PDF
  const tempDiv = document.createElement("div");
  tempDiv.style.cssText = `
    width: 612px; /* 8.5 inches in px at 72dpi */
    padding: 40px;
    background: #D5BC7E;
    font-family: 'Barlow Semi Condensed', Arial, sans-serif;
    position: absolute;
    top: -9999px;
    left: -9999px;
  `;

  tempDiv.innerHTML = `
    <div style="background: #FFF; border-radius: 12px; padding: 32px;">
      <h1 style="color: #101010; text-align: center; font-size: 32px; font-weight: 800; margin-bottom: 40px;">
        My Affirmations
      </h1>
      ${affirmations
        .map(text => `
          <div style="font-size: 18px; font-weight: 600; color: #101010; line-height: 1.4; margin-bottom: 24px; padding: 16px; background: #f9f9f9; border-radius: 8px; border-left: 4px solid #090c9b;">
            ${text.replace(
              /<span class="highlight">/g,
              '<span style="color: #8E8FD1; font-weight: 700;">'
            )}
          </div>
        `)
        .join("")}
    </div>
  `;

  document.body.appendChild(tempDiv);

  // Render as image
  const canvas = await html2canvas(tempDiv);
  const imgData = canvas.toDataURL("image/png");

  // Create PDF (8.5x11 inches)
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter", // 612 x 792
  });

  pdf.addImage(imgData, "PNG", 0, 0, 612, 0); // Auto height
  pdf.save("my-affirmations.pdf");

  document.body.removeChild(tempDiv);
  localStorage.removeItem("selectedAffirmations");

  // Redirect back to splash after 2 sec
  setTimeout(() => {
    window.location.href = "index.html";
  }, 2000);
});

});
