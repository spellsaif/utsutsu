// 🌊 Utsutsu Cyber RPG Summoning Dashboard & Portal Controller

// 1. Initial State
let state = {
  party: [
    { name: "Rimuru Tempest", level: 35, hp: 1200, maxHp: 1500, mp: 85 },
    { name: "Megumin", level: 24, hp: 600, maxHp: 800, mp: 50 },
    { name: "Veldora Tempest", level: 99, hp: 9999, maxHp: 9999, mp: 100 }
  ],
  sealBroken: false,
  logs: 2
};

// 2. Component Render Counters
let renderCounts = {
  header: 1,
  rimuru: 1,
  megumin: 1,
  veldora: 1,
  log: 1
};

// 3. Engine Settings
let brittleSelectorMode = false;

// --- DOM Reference Helpers ---
const DOM = {
  // Badges
  badgeHeader: document.getElementById("badge-header"),
  badgeRimuru: document.getElementById("badge-rimuru"),
  badgeMegumin: document.getElementById("badge-megumin"),
  badgeVeldora: document.getElementById("badge-veldora"),
  badgeLog: document.getElementById("badge-log"),

  // Components for flash animations
  compHeader: document.getElementById("comp-header"),
  compRimuru: document.getElementById("comp-rimuru"),
  compMegumin: document.getElementById("comp-megumin"),
  compVeldora: document.getElementById("comp-veldora"),
  compLog: document.getElementById("comp-log"),

  // Rimuru nodes
  rimuruLevelVal: document.getElementById("rimuru-level-val"),
  rimuruHpVal: document.getElementById("rimuru-hp-val"),
  rimuruMpVal: document.getElementById("rimuru-mp-val"),
  rimuruHpBar: document.getElementById("rimuru-hp-bar"),
  rimuruMpBar: document.getElementById("rimuru-mp-bar"),

  // Megumin nodes
  meguminLevelVal: document.getElementById("megumin-level-val"),
  meguminHpVal: document.getElementById("megumin-hp-val"),
  meguminMpVal: document.getElementById("megumin-mp-val"),
  meguminHpBar: document.getElementById("megumin-hp-bar"),
  meguminMpBar: document.getElementById("megumin-mp-bar"),

  // Veldora nodes
  veldoraLevelVal: document.getElementById("veldora-level-val"),
  veldoraHpVal: document.getElementById("veldora-hp-val"),
  veldoraMpVal: document.getElementById("veldora-mp-val"),
  veldoraHpBar: document.getElementById("veldora-hp-bar"),
  veldoraMpBar: document.getElementById("veldora-mp-bar"),
  veldoraSealGate: document.getElementById("veldora-seal-gate"),

  // System status
  systemStatusText: document.getElementById("system-status-text"),
  logCountVal: document.getElementById("log-count-val"),
  stateJsonView: document.getElementById("state-json-view"),

  // Control Buttons
  btnTrainRimuru: document.getElementById("btn-train-rimuru"),
  btnPredateRimuru: document.getElementById("btn-predate-rimuru"),
  btnCastExplosion: document.getElementById("btn-cast-explosion"),
  btnChannelMegumin: document.getElementById("btn-channel-megumin"),
  btnBreakSeal: document.getElementById("btn-break-seal"),
  btnRestParty: document.getElementById("btn-rest-party"),
  btnExploreDocs: document.getElementById("explore-docs-btn"),

  // Settings Toggle
  brittleToggle: document.getElementById("brittle-toggle"),
  utsutsuLabel: document.getElementById("utsutsu-label"),
  brittleLabel: document.getElementById("brittle-label"),

  // Copy widget
  copyNpmBtn: document.getElementById("copy-npm-btn"),
  copyText: document.querySelector(".copy-text")
};

// --- Render Operations ---
function renderHeader() {
  DOM.badgeHeader.textContent = `Renders: ${renderCounts.header}`;
  
  if (state.sealBroken) {
    DOM.systemStatusText.textContent = "Veldora Released";
    DOM.systemStatusText.classList.add("badge-status");
  } else {
    DOM.systemStatusText.textContent = "Synchronized";
  }
}

function renderRimuru() {
  const rimuru = state.party[0];
  DOM.rimuruLevelVal.textContent = rimuru.level;
  DOM.rimuruHpVal.textContent = rimuru.hp;
  DOM.rimuruMpVal.textContent = rimuru.mp;
  DOM.rimuruHpBar.style.width = `${(rimuru.hp / rimuru.maxHp) * 100}%`;
  DOM.rimuruMpBar.style.width = `${rimuru.mp}%`;
  DOM.badgeRimuru.textContent = `Renders: ${renderCounts.rimuru}`;
}

function renderMegumin() {
  const megumin = state.party[1];
  DOM.meguminLevelVal.textContent = megumin.level;
  DOM.meguminHpVal.textContent = megumin.hp;
  DOM.meguminMpVal.textContent = megumin.mp;
  DOM.meguminHpBar.style.width = `${(megumin.hp / megumin.maxHp) * 100}%`;
  DOM.meguminMpBar.style.width = `${megumin.mp}%`;
  DOM.badgeMegumin.textContent = `Renders: ${renderCounts.megumin}`;
}

function renderVeldora() {
  const veldora = state.party[2];
  DOM.veldoraLevelVal.textContent = veldora.level;
  DOM.veldoraHpVal.textContent = veldora.hp;
  DOM.veldoraMpVal.textContent = veldora.mp;
  DOM.veldoraHpBar.style.width = `${(veldora.hp / veldora.maxHp) * 100}%`;
  DOM.veldoraMpBar.style.width = `${veldora.mp}%`;
  DOM.badgeVeldora.textContent = `Renders: ${renderCounts.veldora}`;
  
  if (state.sealBroken) {
    DOM.veldoraSealGate.style.display = "none";
    document.getElementById("comp-veldora").classList.remove("sealed");
  } else {
    DOM.veldoraSealGate.style.display = "flex";
    document.getElementById("comp-veldora").classList.add("sealed");
  }
}

function renderLogs() {
  DOM.logCountVal.textContent = state.logs;
  DOM.badgeLog.textContent = `Renders: ${renderCounts.log}`;
}

// Visual Highlight State Tree Update with Syntax Coloring
function updateStateTreeJson(highlightKey) {
  let jsonString = JSON.stringify(state, null, 2);
  
  // Escape HTML tags to prevent security issues
  jsonString = jsonString
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  // Match JSON keys, strings, numbers, booleans, and nulls
  jsonString = jsonString.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    function (match) {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    }
  );

  // Apply visual highlight class for key-change flash
  if (highlightKey) {
    if (highlightKey === "party") {
      jsonString = jsonString.replace(
        /(<span class="json-key">"party"<\/span>: \[[\s\S]*?\])/g,
        `<span class="json-key-changed">$1</span>`
      );
    } else if (highlightKey === "sealBroken") {
      jsonString = jsonString.replace(
        /(<span class="json-key">"sealBroken"<\/span>: <span class="json-boolean">true<\/span>)/g,
        `<span class="json-key-changed">$1</span>`
      );
    } else if (highlightKey === "logs") {
      jsonString = jsonString.replace(
        /(<span class="json-key">"logs"<\/span>: <span class="json-number">\d+<\/span>)/g,
        `<span class="json-key-changed">$1</span>`
      );
    }
  }
  
  DOM.stateJsonView.innerHTML = jsonString;
}

// Flash Animation Trigger
function flashComponent(componentEl) {
  componentEl.classList.remove("flash");
  // Trigger reflow to restart animation
  void componentEl.offsetWidth;
  componentEl.classList.add("flash");
}

// --- Controller Handlers ---

// Trigger component updates based on Mode (Utsutsu precise vs Brittle all)
function dispatchUpdate(updatedComponentKeys) {
  if (brittleSelectorMode) {
    // 🐻 Brittle Mode: Re-renders the entire application for any state change
    renderCounts.header++;
    renderCounts.rimuru++;
    renderCounts.megumin++;
    renderCounts.veldora++;
    renderCounts.log++;
    
    flashComponent(DOM.compHeader);
    flashComponent(DOM.compRimuru);
    flashComponent(DOM.compMegumin);
    flashComponent(DOM.compVeldora);
    flashComponent(DOM.compLog);
    
    renderHeader();
    renderRimuru();
    renderMegumin();
    renderVeldora();
    renderLogs();
  } else {
    // 🌊 Utsutsu Mode: Precision dependency evaluation
    updatedComponentKeys.forEach(key => {
      renderCounts[key]++;
      
      if (key === "header") {
        flashComponent(DOM.compHeader);
        renderHeader();
      } else if (key === "rimuru") {
        flashComponent(DOM.compRimuru);
        renderRimuru();
      } else if (key === "megumin") {
        flashComponent(DOM.compMegumin);
        renderMegumin();
      } else if (key === "veldora") {
        flashComponent(DOM.compVeldora);
        renderVeldora();
      } else if (key === "log") {
        flashComponent(DOM.compLog);
        renderLogs();
      }
    });
  }
}

// Action: Train Rimuru
function trainRimuru() {
  state.party[0].level += 1;
  state.logs += 1;
  
  dispatchUpdate(["rimuru", "log"]);
  updateStateTreeJson("party");
}

// Action: Predate (Heal Rimuru HP)
function predateRimuru() {
  state.party[0].hp = Math.min(state.party[0].maxHp, state.party[0].hp + 200);
  state.logs += 1;
  
  dispatchUpdate(["rimuru", "log"]);
  updateStateTreeJson("party");
}

// Action: Cast Explosion (Megumin)
function castExplosion() {
  if (state.party[1].mp >= 40) {
    state.party[1].mp = 0; // Megumin drains all mana on Explosion
    state.party[1].hp = 1; // Megumin collapses
    state.logs += 1;
    
    dispatchUpdate(["megumin", "log"]);
    updateStateTreeJson("party");
  } else {
    alert("Megumin has insufficient Mana to cast Explosion!");
  }
}

// Action: Channel Mana (Megumin)
function channelMegumin() {
  state.party[1].mp = Math.min(100, state.party[1].mp + 25);
  state.logs += 1;
  
  dispatchUpdate(["megumin", "log"]);
  updateStateTreeJson("party");
}

// Action: Break Veldora Seal (Coordinated Transaction Frame)
function breakVeldoraSeal() {
  // Multiple states are modified, but subscribers trigger exactly once
  state.sealBroken = true;
  state.party[2].mp = 100;
  state.party[2].hp = 9999;
  state.logs += 1;
  
  // Batched updates: render count increments only once for all affected components
  dispatchUpdate(["header", "veldora", "log"]);
  updateStateTreeJson("sealBroken");
}

// Action: Rest Entire Party (Coordinated Transaction Frame)
function restParty() {
  // Batch updates Rimuru and Megumin, and Veldora if unsealed
  state.party[0].hp = state.party[0].maxHp;
  state.party[0].mp = 100;
  state.party[1].hp = state.party[1].maxHp;
  state.party[1].mp = 100;
  state.logs += 1;
  
  dispatchUpdate(["rimuru", "megumin", "log"]);
  updateStateTreeJson("party");
}

// Toggle Mode Selection
function handleEngineToggle(e) {
  brittleSelectorMode = e.target.checked;
  
  if (brittleSelectorMode) {
    DOM.brittleLabel.classList.remove("text-muted");
    DOM.utsutsuLabel.classList.add("text-muted");
  } else {
    DOM.utsutsuLabel.classList.remove("text-muted");
    DOM.brittleLabel.classList.add("text-muted");
  }
}

// --- Tab Switcher Logic ---

// Sandbox Visualizer Tab Selector (State Tree vs Code)
document.querySelectorAll(".v-tab").forEach(tab => {
  tab.addEventListener("click", (e) => {
    document.querySelectorAll(".v-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".v-panel").forEach(p => p.classList.remove("active"));
    
    e.target.classList.add("active");
    const targetPanel = document.getElementById(e.target.dataset.target);
    targetPanel.classList.add("active");
  });
});

// Top level navigation tab selector (HUD vs Guide vs Recipes vs API)
document.querySelectorAll(".nav-tab-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".nav-tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".portal-tab-content").forEach(c => c.classList.remove("active"));
    
    e.currentTarget.classList.add("active");
    const targetTab = document.getElementById(e.currentTarget.dataset.tab);
    if (targetTab) {
      targetTab.classList.add("active");
    }
  });
});

// Inner navigation tab routing (for Guidebook and Recipes)
document.querySelectorAll(".docs-nav-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    // Find parent pane context
    const parentPane = e.currentTarget.closest(".portal-tab-content");
    parentPane.querySelectorAll(".docs-nav-btn").forEach(b => b.classList.remove("active"));
    parentPane.querySelectorAll(".docs-chapter").forEach(c => c.classList.remove("active"));
    
    e.currentTarget.classList.add("active");
    const targetChapter = document.getElementById(`chap-${e.currentTarget.dataset.chapter}`);
    if (targetChapter) {
      targetChapter.classList.add("active");
      if (window.innerWidth <= 768) {
        targetChapter.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });
});

// Explore documentation CTA trigger
DOM.btnExploreDocs.addEventListener("click", (e) => {
  e.preventDefault();
  // Find Guidebook button in header and click it
  const guideTabBtn = document.querySelector('.nav-tab-btn[data-tab="tab-guide-section"]');
  if (guideTabBtn) {
    guideTabBtn.click();
  }
});

// Copy to Clipboard NPM Widget
DOM.copyNpmBtn.addEventListener("click", () => {
  navigator.clipboard.writeText("npm install utsutsu").then(() => {
    DOM.copyNpmBtn.classList.add("copied");
    DOM.copyText.textContent = "Copied!";
    
    setTimeout(() => {
      DOM.copyNpmBtn.classList.remove("copied");
      DOM.copyText.textContent = "Copy";
    }, 2000);
  });
});

// --- Initialize Event Listeners ---
DOM.btnTrainRimuru.addEventListener("click", trainRimuru);
DOM.btnPredateRimuru.addEventListener("click", predateRimuru);
DOM.btnCastExplosion.addEventListener("click", castExplosion);
DOM.btnChannelMegumin.addEventListener("click", channelMegumin);
DOM.btnBreakSeal.addEventListener("click", breakVeldoraSeal);
DOM.btnRestParty.addEventListener("click", restParty);
DOM.brittleToggle.addEventListener("change", handleEngineToggle);

// --- Boot Application ---
renderHeader();
renderRimuru();
renderMegumin();
renderVeldora();
renderLogs();
updateStateTreeJson();
