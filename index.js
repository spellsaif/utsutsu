// 🌊 Utsutsu Landing Page Zen Garden Simulator & Documentation Controller

// 1. Initial State (Zen Garden Theme)
let state = {
  pond: {
    ripples: 0,
    still: true
  },
  stones: 5,
  meditations: 0
};

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

  // Zen garden nodes
  rippleCountVal: document.getElementById("ripple-count-val"),
  pondWaterBg: document.getElementById("pond-water-bg"),
  pondStatusText: document.getElementById("pond-status-text"),
  stoneCountVal: document.getElementById("stone-count-val"),
  logCountVal: document.getElementById("log-count-val"),
  stateJsonView: document.getElementById("state-json-view"),

  // Control Buttons
  arrangeBtn: document.getElementById("rename-btn"),
  addStoneBtn: document.getElementById("rest-hero-btn"),
  dropPebbleBtn: document.getElementById("todo-add-btn"),
  calmBtn: document.getElementById("channel-mana-btn"),
  rakeBtn: document.getElementById("frame-batch-btn"),
  
  // Switch
  brittleToggle: document.getElementById("brittle-toggle"),
  utsutsuLabel: document.getElementById("utsutsu-label"),
  brittleLabel: document.getElementById("brittle-label"),

  // Copy widget
  copyNpmBtn: document.getElementById("copy-npm-btn"),
  copyText: document.querySelector(".copy-text")
};

// --- Render Operations ---
function renderHeader() {
  DOM.badgeHeader.textContent = `Updates: ${renderCounts.header}`;
}

function renderStones() {
  DOM.stoneCountVal.textContent = state.stones;
  DOM.badgeUser.textContent = `Updates: ${renderCounts.user}`;
}

function renderPond() {
  DOM.rippleCountVal.textContent = state.pond.ripples;
  
  if (state.pond.still) {
    DOM.pondWaterBg.classList.remove("rippling");
    DOM.pondStatusText.textContent = "Still Water";
  } else {
    DOM.pondWaterBg.classList.add("rippling");
    DOM.pondStatusText.textContent = `Ripples Active (${state.pond.ripples})`;
  }
  
  DOM.badgeTodos.textContent = `Updates: ${renderCounts.todos}`;
}

function renderLogs() {
  DOM.logCountVal.textContent = state.meditations;
  DOM.badgeLog.textContent = `Updates: ${renderCounts.log}`;
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
    if (highlightKey === "pond") {
      jsonString = jsonString.replace(
        /(<span class="json-key">"pond"<\/span>: {[\s\S]*?})/g,
        `<span class="json-key-changed">$1</span>`
      );
    } else if (highlightKey === "stones") {
      jsonString = jsonString.replace(
        /(<span class="json-key">"stones"<\/span>: <span class="json-number">\d+<\/span>)/g,
        `<span class="json-key-changed">$1</span>`
      );
    } else if (highlightKey === "meditations") {
      jsonString = jsonString.replace(
        /(<span class="json-key">"meditations"<\/span>: <span class="json-number">\d+<\/span>)/g,
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
    renderStones();
    renderPond();
    renderLogs();
  } else {
    // 🌊 Utsutsu Mode: Precision dependency evaluation
    updatedComponentKeys.forEach(key => {
      renderCounts[key]++;
      
      if (key === "user") {
        flashComponent(DOM.compUser);
        renderStones();
      } else if (key === "todos") {
        flashComponent(DOM.compTodos);
        renderPond();
      } else if (key === "log") {
        flashComponent(DOM.compLog);
        renderLogs();
      }
    });
  }
}

// Action: Arrange Stones
function arrangeStones() {
  state.meditations += 1;
  dispatchUpdate(["log"]);
  updateStateTreeJson("meditations");
}

// Action: Add Stone
function addStone() {
  state.stones += 1;
  state.meditations += 1;
  
  dispatchUpdate(["user", "log"]);
  updateStateTreeJson("stones");
}

// Action: Drop Pebble
function dropPebble() {
  state.pond.ripples += 1;
  state.pond.still = false;
  state.meditations += 1;
  
  dispatchUpdate(["todos", "log"]);
  updateStateTreeJson("pond");
}

// Action: Calm Pond
function calmPond() {
  state.pond.ripples = 0;
  state.pond.still = true;
  state.meditations += 1;
  
  dispatchUpdate(["todos", "log"]);
  updateStateTreeJson("pond");
}

// Action: Rake Garden (Batched Transaction Frame)
function rakeGarden() {
  // Simulates a single frame tick grouping multiple state modifications
  state.pond.ripples = 0;
  state.pond.still = true;
  state.stones = 5; // Resets arrangement
  state.meditations += 1;
  
  // Subscribers are updated exactly once at the end of the tick
  dispatchUpdate(["todos", "user", "log"]);
  updateStateTreeJson("pond");
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

// Documentation Chapter Sidebar Tabs
document.querySelectorAll(".docs-nav-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".docs-nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".docs-chapter").forEach(c => c.classList.remove("active"));
    
    e.currentTarget.classList.add("active");
    const targetChapter = document.getElementById(`chap-${e.currentTarget.dataset.chapter}`);
    if (targetChapter) {
      targetChapter.classList.add("active");
      // Scroll content section slightly into view if on mobile screen size
      if (window.innerWidth <= 768) {
        targetChapter.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
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
DOM.arrangeBtn.addEventListener("click", arrangeStones);
DOM.addStoneBtn.addEventListener("click", addStone);
DOM.dropPebbleBtn.addEventListener("click", dropPebble);
DOM.calmBtn.addEventListener("click", calmPond);
DOM.rakeBtn.addEventListener("click", rakeGarden);
DOM.brittleToggle.addEventListener("change", handleEngineToggle);

// --- Boot Application ---
renderHeader();
renderStones();
renderPond();
renderLogs();
updateStateTreeJson();
