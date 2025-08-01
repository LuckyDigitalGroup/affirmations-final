console.log("✅ behavioral.js is loaded");

let selectionCount = { celebration: 0, transformation: 0 };

function updateGlobalProgressBar() {
  const progressBar = document.getElementById("progress-bar-fill");
  if (!progressBar) return;

  // Get selections from localStorage (what's been saved from previous pages)
  const data = JSON.parse(localStorage.getItem("selectedAffirmations")) || {};
  let savedSelections = 0;

  // Count only saved selections from other pages (not current page)
  ["behavioral", "emotional", "demographic"].forEach((category) => {
    // Skip current page to avoid double counting
    if (category !== "behavioral" && data[category]) {
      savedSelections += Object.keys(data[category]).length;
    }
  });

  // Add current page selections
  const currentPageSelections = selectionCount.celebration + selectionCount.transformation;
  const totalSelections = savedSelections + currentPageSelections;
  
  // Calculate percentage: (selections ÷ 6) × 100 (since you have 3 pages × 2 selections each)
  const percent = Math.min((totalSelections / 6) * 100, 100);
  progressBar.style.width = `${percent}%`;
  
  console.log(`Total progress: ${totalSelections}/6 selections = ${percent}%`);
}

function updateProgress() {
  const continueBtn = document.getElementById("continue-btn");
  const total = selectionCount.celebration + selectionCount.transformation;

  console.log("🔄 updateProgress called:", { selectionCount, total });

  continueBtn.classList.remove("state-disabled", "state-partial", "state-ready");

  if (total === 0) {
    continueBtn.classList.add("state-disabled");
    continueBtn.textContent = "0/2";
    continueBtn.disabled = true;
    console.log("📵 Button disabled");
  } else if (total === 1) {
    continueBtn.classList.add("state-partial");
    continueBtn.textContent = "1/2";
    continueBtn.disabled = true;
    console.log("⚠️ Button partial (1/2)");
  } else {
    continueBtn.classList.add("state-ready");
    continueBtn.textContent = "Continue";
    continueBtn.disabled = false;
    console.log("✅ Button ready and ENABLED!");
  }

  document.getElementById("celebration-count").textContent = `${selectionCount.celebration}/1 Selected`;
  document.getElementById("transformation-count").textContent = `${selectionCount.transformation}/1 Selected`;

  updateGlobalProgressBar(); // ✅ This now matches the function name
}

function renderAffirmationSection(sectionData, containerId, type) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const traits = Object.entries(sectionData);
  let currentRow = document.createElement("div");
  currentRow.className = "pill-row";
  container.appendChild(currentRow);

  traits.forEach(([trait, affirmations], index) => {
    if (index > 0 && index % 7 === 0) {
      currentRow = document.createElement("div");
      currentRow.className = "pill-row";
      container.appendChild(currentRow);
    }

    const pill = document.createElement("div");
    pill.className = "pill";
    pill.dataset.trait = trait;
    pill.dataset.type = type;

    pill.innerHTML = `
      <div class="pill-header">
        <span class="pill-title">${trait}</span>
        <img class="chevron" src="assets/Chevron down.svg" alt="Expand">
      </div>
      <div class="pill-body" style="display: none;">
        <p class="sentence-option">${affirmations[0].text}</p>
        <div class="pill-divider"></div>
        <p class="sentence-option">${affirmations[1].text}</p>
      </div>
    `;

    currentRow.appendChild(pill);
  });

  setPillInteractions(type);
}

function lockScroll(container) {
  container.style.overflowX = 'hidden';
}

function unlockScroll(container) {
  container.style.overflowX = 'auto';
}

function setPillInteractions(type) {
  const pills = document.querySelectorAll(`.pill[data-type="${type}"]`);

  pills.forEach(pill => {
    const header = pill.querySelector(".pill-header");
    const body = pill.querySelector(".pill-body");
    const chevron = pill.querySelector(".chevron");

    pill.addEventListener("click", (e) => {
      if (e.target.closest(".sentence-option") || e.target.closest(".deselect-btn")) return;

      const isOpen = body.style.display === "block";

      document.querySelectorAll(`.pill[data-type="${type}"]`).forEach(p => {
        p.classList.remove("pill-expanded");
        p.querySelector(".pill-body").style.display = "none";
        const icon = p.querySelector(".chevron");
        icon.style.transform = "rotate(0deg)";
      });

      if (!isOpen) {
        body.style.display = "block";
        pill.classList.add("pill-expanded");
        chevron.style.transform = "rotate(180deg)";
        pill.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    });

    body.querySelectorAll(".sentence-option").forEach(sentence => {
      sentence.addEventListener("click", () => {
        console.log("🎯 Sentence clicked:", sentence.textContent);
        
        const selectedText = sentence.textContent;
        const trait = pill.dataset.trait;
        const affirmations = window.allAffirmations[type][trait];
        const match = affirmations.find(a => a.text === selectedText);
        const highlight = match?.highlight || "";

        const sectionContainer = document.getElementById(type + "-container");

        sectionContainer.querySelectorAll(".pill-row").forEach(row => row.style.display = "none");

        const newRow = document.createElement("div");
        newRow.className = "pill-row";

        const selectedPill = document.createElement("div");
        selectedPill.className = "pill pill-selected";
        selectedPill.dataset.type = type;

        selectedPill.innerHTML = `
          <div class="pill-header">
            <span class="pill-title">${pill.dataset.trait}</span>
            <button class="deselect-btn">
              <img src="assets/x.svg" alt="Deselect">
            </button>
          </div>
          <div class="pill-body">
            <p class="selected-text" data-highlight="${highlight}">${selectedText}</p>
          </div>
        `;

        newRow.appendChild(selectedPill);
        sectionContainer.appendChild(newRow);
        selectedPill.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        setTimeout(() => {
         lockScroll(sectionContainer);
        }, 500); // Wait for scroll animation to complete

        selectionCount[type] = 1;
        console.log("📊 Selection count updated:", selectionCount);
        updateProgress();

        selectedPill.querySelector(".deselect-btn").addEventListener("click", () => {
          console.log("❌ Deselect clicked for:", type);
          selectionCount[type] = 0;
          updateProgress();
          unlockScroll(sectionContainer);
          renderAffirmationSection(window.allAffirmations[type], sectionContainer.id, type);
        });
      });
    });
  });
}

window.allAffirmations = {};

window.addEventListener('DOMContentLoaded', async () => {
  console.log("🚀 DOM Content Loaded");
  
  // Clear current page data to start fresh
  const data = JSON.parse(localStorage.getItem("selectedAffirmations")) || {};
  delete data.behavioral; // ✅ Fixed: delete current page data, not emotional
  localStorage.setItem("selectedAffirmations", JSON.stringify(data));
  
  const response = await fetch('./affirmations.json');
  const affirmationsData = await response.json();

  window.allAffirmations = {
    celebration: affirmationsData.behavioral.celebration,
    transformation: affirmationsData.behavioral.transformation,
  };

  renderAffirmationSection(window.allAffirmations.celebration, "celebration-container", "celebration");
  renderAffirmationSection(window.allAffirmations.transformation, "transformation-container", "transformation");

  updateProgress();

  const continueBtn = document.getElementById("continue-btn");
  
  continueBtn.addEventListener("click", () => {
    const selected = {};

    ["celebration", "transformation"].forEach(type => {
  const pill = document.querySelector(`.pill-selected[data-type="${type}"]`);
  const trait = pill.querySelector(".pill-title").textContent;
  const textEl = pill.querySelector(".selected-text");
  const text = textEl.textContent;
  const highlight = textEl.dataset.highlight || "";
  selected[type] = { trait, text, highlight };
});

    const allSelections = JSON.parse(localStorage.getItem("selectedAffirmations")) || {};
    allSelections.behavioral = selected;
    localStorage.setItem("selectedAffirmations", JSON.stringify(allSelections));
    
    console.log("🚀 Navigating to emotional.html");
    window.location.href = "emotional.html";
  });
});