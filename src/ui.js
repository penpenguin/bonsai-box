const STORAGE_KEY = "bonsai-box:state";

export function createUI({ root, state, actions }) {
  const uiState = {
    preset: state.preset,
    presetLabel: state.presetLabel,
    seed: String(state.seed),
    autoRotate: Boolean(state.autoRotate),
  };
  const meta = root.querySelector("[data-role='meta']");
  const seedInput = root.querySelector("[data-role='seed-input']");

  function render() {
    if (seedInput) {
      seedInput.value = uiState.seed;
    }

    if (meta) {
      meta.textContent = `${uiState.presetLabel} / seed: ${uiState.seed}`;
    }

    root.querySelectorAll("[data-action='preset']").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.preset === uiState.preset);
    });

    const autoRotateButton = root.querySelector("[data-action='toggle-autorotate']");
    if (autoRotateButton) {
      autoRotateButton.setAttribute("aria-pressed", String(uiState.autoRotate));
      autoRotateButton.textContent = uiState.autoRotate ? "自動回転 ON" : "自動回転 OFF";
    }
  }

  function persistState() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        preset: uiState.preset,
        seed: uiState.seed,
        autoRotate: uiState.autoRotate,
      }),
    );
  }

  function updateState(nextState) {
    Object.assign(uiState, nextState);
    render();
  }

  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action;
    if (action === "preset") {
      actions.onPresetChange?.(button.dataset.preset);
      return;
    }

    if (action === "randomize") {
      actions.onRandomize?.();
      return;
    }

    if (action === "reset-view") {
      actions.onResetView?.();
      return;
    }

    if (action === "toggle-autorotate") {
      actions.onToggleAutoRotate?.();
      return;
    }

    if (action === "save-png") {
      actions.onSavePng?.();
      return;
    }

    if (action === "apply-seed") {
      actions.onApplySeed?.(seedInput?.value?.trim() || "");
    }
  });

  seedInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      actions.onApplySeed?.(seedInput.value.trim());
    }
  });

  render();

  return {
    getState() {
      return { ...uiState };
    },
    persistState,
    updateState,
  };
}

createUI.loadStoredState = function loadStoredState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      preset: parsed.preset,
      seed: String(parsed.seed),
      autoRotate: Boolean(parsed.autoRotate),
    };
  } catch {
    return null;
  }
};
