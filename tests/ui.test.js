import { beforeEach, describe, expect, it, vi } from "vitest";
import { createUI } from "../src/ui.js";

function setupDom() {
  document.body.innerHTML = `
    <div id="controls">
      <button data-action="preset" data-preset="straight">直幹</button>
      <button data-action="preset" data-preset="windswept">吹き流し</button>
      <button data-action="randomize">ランダム生成</button>
      <button data-action="reset-view">視点リセット</button>
      <button data-action="toggle-autorotate">自動回転</button>
      <button data-action="save-png">PNG保存</button>
      <input data-role="seed-input" />
      <button data-action="apply-seed">seed適用</button>
      <div data-role="meta"></div>
    </div>
  `;
}

describe("createUI", () => {
  beforeEach(() => {
    localStorage.clear();
    setupDom();
  });

  it("renders the current preset label and seed", () => {
    const ui = createUI({
      root: document.querySelector("#controls"),
      state: { preset: "straight", presetLabel: "直幹", seed: "2026", autoRotate: false },
      actions: {},
    });

    expect(document.querySelector("[data-role='meta']").textContent).toContain("直幹");
    expect(document.querySelector("[data-role='meta']").textContent).toContain("2026");
    expect(ui.getState().seed).toBe("2026");
  });

  it("dispatches actions from button interactions", () => {
    const actions = {
      onPresetChange: vi.fn(),
      onRandomize: vi.fn(),
      onResetView: vi.fn(),
      onToggleAutoRotate: vi.fn(),
      onSavePng: vi.fn(),
      onApplySeed: vi.fn(),
    };

    createUI({
      root: document.querySelector("#controls"),
      state: { preset: "straight", presetLabel: "直幹", seed: "2026", autoRotate: false },
      actions,
    });

    document.querySelector("[data-preset='windswept']").click();
    document.querySelector("[data-action='randomize']").click();
    document.querySelector("[data-action='reset-view']").click();
    document.querySelector("[data-action='toggle-autorotate']").click();
    document.querySelector("[data-action='save-png']").click();

    expect(actions.onPresetChange).toHaveBeenCalledWith("windswept");
    expect(actions.onRandomize).toHaveBeenCalled();
    expect(actions.onResetView).toHaveBeenCalled();
    expect(actions.onToggleAutoRotate).toHaveBeenCalled();
    expect(actions.onSavePng).toHaveBeenCalled();
  });

  it("submits the seed from the input", () => {
    const actions = {
      onApplySeed: vi.fn(),
    };

    createUI({
      root: document.querySelector("#controls"),
      state: { preset: "straight", presetLabel: "直幹", seed: "2026", autoRotate: false },
      actions,
    });

    const input = document.querySelector("[data-role='seed-input']");
    input.value = "777";
    document.querySelector("[data-action='apply-seed']").click();

    expect(actions.onApplySeed).toHaveBeenCalledWith("777");
  });

  it("persists and restores state from localStorage", () => {
    const ui = createUI({
      root: document.querySelector("#controls"),
      state: { preset: "slant", presetLabel: "斜幹", seed: "303", autoRotate: true },
      actions: {},
    });

    ui.persistState();

    expect(JSON.parse(localStorage.getItem("bonsai-box:state"))).toEqual({
      preset: "slant",
      seed: "303",
      autoRotate: true,
    });
    expect(createUI.loadStoredState()).toEqual({
      preset: "slant",
      seed: "303",
      autoRotate: true,
    });
  });
});
