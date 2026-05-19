// 🌊 Utsutsu Landing Page Anime RPG Simulator Logic

// 1. Initial State (Isekai RPG Theme)
let state = {
  hero: {
    name: "Rimuru Tempest",
    level: 35,
    hp: 1200
  },
  mana: 85,
  logs: 2
};

// Max values for mock validation
const HERO_MAX_HP = 1500;

// 2. Component Render Counters
let renderCounts = {
  header: 1,
  user: 1,
  todos: 1,
  log: 1
};

// 3. Engine Settings
let brittleSelectorMode = false;

// --- DOM Reference Helpers ---
const DOM = {
  // Badges
  badgeHeader: document.getElementById("badge-header"),
  badgeUser: document.getElementById("badge-user"),
  badgeTodos: document.getElementById("badge-todos"),
  badgeLog: document.getElementById("badge-log"),

  // Components (for flash animations)
  compHeader: document.getElementById("comp-header"),
  compUser: document.getElementById("comp-user"),
  compTodos: document.getElementById("comp-todos"),
  compLog: document.getElementById("comp-log"),

  // RPG Stat Nodes
  heroDisplayName: document.getElementById("hero-display-name"),
  heroLevelVal: document.getElementById("hero-level-val"),
  heroHpVal: document.getElementById("hero-hp-val"),
  manaPercentVal: document.getElementById("mana-percent-val"),
  manaBarFill: document.getElementById("mana-bar-fill"),
  logCountVal: document.getElementById("log-count-val"),
  stateJsonView: document.getElementById("state-json-view"),

  // Control Buttons
  trainBtn: document.getElementById("rename-btn"),
  restBtn: document.getElementById("rest-hero-btn"),
  castBtn: document.getElementById("todo-add-btn"),
  channelBtn: document.getElementById("channel-mana-btn"),
  ultimateBtn: document.getElementById("frame-batch-btn"),
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
}

function renderHero() {
  DOM.heroDisplayName.textContent = state.hero.name;
  DOM.heroLevelVal.textContent = state.hero.level;
  DOM.heroHpVal.textContent = state.hero.hp;
  DOM.badgeUser.textContent = `Renders: ${renderCounts.user}`;
}

// Render Mana status
function renderMana() {
  DOM.manaPercentVal.textContent = `${state.mana}%`;
  DOM.manaBarFill.style.width = `${state.mana}%`;
  DOM.badgeTodos.textContent = `Renders: ${renderCounts.todos}`;
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
    if (highlightKey === "hero") {
      jsonString = jsonString.replace(
        /(<span class="json-key">"hero"<\/span>: {[\s\S]*?})/g,
        `<span class="json-key-changed">$1</span>`
      );
    } else if (highlightKey === "mana") {
      jsonString = jsonString.replace(
        /(<span class="json-key">"mana"<\/span>: <span class="json-number">\d+<\/span>)/g,
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
    renderCounts.user++;
    renderCounts.todos++;
    renderCounts.log++;
    
    flashComponent(DOM.compHeader);
    flashComponent(DOM.compUser);
    flashComponent(DOM.compTodos);
    flashComponent(DOM.compLog);
    
    renderHeader();
    renderHero();
    renderMana();
    renderLogs();
  } else {
    // 🌊 Utsutsu Mode: Precision dependency evaluation
    updatedComponentKeys.forEach(key => {
      renderCounts[key]++;
      
      if (key === "user") {
        flashComponent(DOM.compUser);
        renderHero();
      } else if (key === "todos") {
        flashComponent(DOM.compTodos);
        renderMana();
      } else if (key === "log") {
        flashComponent(DOM.compLog);
        renderLogs();
      }
    });
  }
}

// Action: Train (Level Up)
function trainHero() {
  state.hero.level += 1;
  state.logs += 1;
  
  dispatchUpdate(["user", "log"]);
  updateStateTreeJson("hero");
}

// Action: Rest (Heal HP)
function restHero() {
  state.hero.hp = Math.min(HERO_MAX_HP, state.hero.hp + 100);
  state.logs += 1;
  
  dispatchUpdate(["user", "log"]);
  updateStateTreeJson("hero");
}

// Action: Cast (Explosion!)
function castExplosion() {
  if (state.mana >= 30) {
    state.mana -= 30;
    state.hero.hp = Math.max(0, state.hero.hp - 50); // slight self-recoil
    state.logs += 1;
    
    dispatchUpdate(["todos", "user", "log"]);
    updateStateTreeJson("mana");
  } else {
    // Out of mana warning
    alert("Mana depleted! Cannot trigger spell.");
  }
}

// Action: Channel Mana
function channelMana() {
  state.mana = Math.min(100, state.mana + 15);
  state.logs += 1;
  
  dispatchUpdate(["todos", "log"]);
  updateStateTreeJson("mana");
}

// Action: Run ultimate batched transaction frame
function runUltimateBatch() {
  // Wrap writes in a mock single tick frame transaction
  // Multiple states are updated, but subscribers trigger exactly once
  state.hero.hp = HERO_MAX_HP;
  state.mana = 100;
  state.logs += 1;
  
  // Updates are batched: render count increments only once for all affected components
  dispatchUpdate(["user", "todos", "log"]);
  updateStateTreeJson("hero");
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

// Code & State Visualizer Panel Tab
document.querySelectorAll(".v-tab").forEach(tab => {
  tab.addEventListener("click", (e) => {
    document.querySelectorAll(".v-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".v-panel").forEach(p => p.classList.remove("active"));
    
    e.target.classList.add("active");
    const targetPanel = document.getElementById(e.target.dataset.target);
    targetPanel.classList.add("active");
  });
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
DOM.trainBtn.addEventListener("click", trainHero);
DOM.restBtn.addEventListener("click", restHero);
DOM.castBtn.addEventListener("click", castExplosion);
DOM.channelBtn.addEventListener("click", channelMana);
DOM.ultimateBtn.addEventListener("click", runUltimateBatch);
DOM.brittleToggle.addEventListener("change", handleEngineToggle);

// --- Boot Application ---
renderHeader();
renderHero();
renderMana();
renderLogs();
updateStateTreeJson();
