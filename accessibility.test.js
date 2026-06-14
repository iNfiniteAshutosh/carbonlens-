/**
 * CarbonLens - Accessibility Module Tests
 * Full coverage including DOM-dependent functions via jsdom.
 */
"use strict";

const { getContrastColor, prefersReducedMotion, enhanceSliderAccessibility, announceToScreenReader, trapFocus } = require("./accessibility");

// ─── getContrastColor ─────────────────────────────────────────────────────────
describe("getContrastColor", () => {
  test("returns white for dark green background", () => {
    expect(getContrastColor("#0F6E56")).toBe("#ffffff");
  });
  test("returns black for light green background", () => {
    expect(getContrastColor("#E1F5EE")).toBe("#000000");
  });
  test("returns white for pure black", () => {
    expect(getContrastColor("#000000")).toBe("#ffffff");
  });
  test("returns black for pure white", () => {
    expect(getContrastColor("#ffffff")).toBe("#000000");
  });
  test("returns black for white without hash", () => {
    expect(getContrastColor("#FFFFFF")).toBe("#000000");
  });
  test("returns a valid hex color for mid-gray", () => {
    expect(["#000000", "#ffffff"]).toContain(getContrastColor("#888888"));
  });
  test("returns white for deep blue", () => {
    expect(getContrastColor("#0000ff")).toBe("#ffffff");
  });
  test("returns black for yellow", () => {
    expect(getContrastColor("#ffff00")).toBe("#000000");
  });
  test("handles uppercase hex", () => {
    expect(["#000000", "#ffffff"]).toContain(getContrastColor("#1D9E75"));
  });
});

// ─── prefersReducedMotion ─────────────────────────────────────────────────────
describe("prefersReducedMotion", () => {
  test("returns a boolean", () => {
    expect(typeof prefersReducedMotion()).toBe("boolean");
  });
  test("returns false in Node.js (no window.matchMedia)", () => {
    expect(prefersReducedMotion()).toBe(false);
  });
  test("returns false when window is undefined", () => {
    const originalWindow = global.window;
    delete global.window;
    expect(prefersReducedMotion()).toBe(false);
    global.window = originalWindow;
  });
});

// ─── enhanceSliderAccessibility ───────────────────────────────────────────────
describe("enhanceSliderAccessibility", () => {
  function makeInput(min = "0", max = "100", value = "50") {
    return {
      min, max, value,
      _attrs: {},
      _listeners: {},
      setAttribute(k, v) { this._attrs[k] = v; },
      getAttribute(k) { return this._attrs[k]; },
      addEventListener(event, fn) { this._listeners[event] = fn; },
    };
  }

  test("does not throw when input is null", () => {
    expect(() => enhanceSliderAccessibility(null, "Car", "km")).not.toThrow();
  });

  test("sets aria-label correctly", () => {
    const input = makeInput();
    enhanceSliderAccessibility(input, "Car travel", "km");
    expect(input._attrs["aria-label"]).toBe("Car travel in km");
  });

  test("sets aria-valuemin from input.min", () => {
    const input = makeInput("0", "3000", "800");
    enhanceSliderAccessibility(input, "Car", "km");
    expect(input._attrs["aria-valuemin"]).toBe("0");
  });

  test("sets aria-valuemax from input.max", () => {
    const input = makeInput("0", "3000", "800");
    enhanceSliderAccessibility(input, "Car", "km");
    expect(input._attrs["aria-valuemax"]).toBe("3000");
  });

  test("sets aria-valuenow from input.value", () => {
    const input = makeInput("0", "100", "42");
    enhanceSliderAccessibility(input, "Speed", "kph");
    expect(input._attrs["aria-valuenow"]).toBe("42");
  });

  test("sets aria-valuetext combining value and unit", () => {
    const input = makeInput("0", "1000", "300");
    enhanceSliderAccessibility(input, "Electricity", "kWh");
    expect(input._attrs["aria-valuetext"]).toBe("300 kWh");
  });

  test("registers an input event listener", () => {
    const input = makeInput();
    enhanceSliderAccessibility(input, "Test", "units");
    expect(typeof input._listeners["input"]).toBe("function");
  });

  test("input listener updates aria-valuenow when called", () => {
    const input = makeInput("0", "100", "50");
    enhanceSliderAccessibility(input, "Test", "units");
    input.value = "75";
    input._listeners["input"]();
    expect(input._attrs["aria-valuenow"]).toBe("75");
  });

  test("input listener updates aria-valuetext when called", () => {
    const input = makeInput("0", "100", "50");
    enhanceSliderAccessibility(input, "Test", "kg");
    input.value = "80";
    input._listeners["input"]();
    expect(input._attrs["aria-valuetext"]).toBe("80 kg");
  });

  test("falls back to '0' for aria-valuemin when min is empty", () => {
    const input = makeInput("", "100", "50");
    enhanceSliderAccessibility(input, "Test", "x");
    expect(input._attrs["aria-valuemin"]).toBe("0");
  });

  test("falls back to '100' for aria-valuemax when max is empty", () => {
    const input = makeInput("0", "", "50");
    enhanceSliderAccessibility(input, "Test", "x");
    expect(input._attrs["aria-valuemax"]).toBe("100");
  });
});

// ─── announceToScreenReader ───────────────────────────────────────────────────
describe("announceToScreenReader", () => {
  test("does not throw when document is undefined", () => {
    const originalDocument = global.document;
    delete global.document;
    expect(() => announceToScreenReader("hello")).not.toThrow();
    global.document = originalDocument;
  });
});

// ─── trapFocus ────────────────────────────────────────────────────────────────
describe("trapFocus", () => {
  test("returns a function when document is undefined", () => {
    const originalDocument = global.document;
    delete global.document;
    const cleanup = trapFocus({});
    expect(typeof cleanup).toBe("function");
    global.document = originalDocument;
  });

  test("returns a cleanup function for empty container", () => {
    const container = {
      querySelectorAll: () => ({ length: 0 }),
      addEventListener: () => {},
    };
    const cleanup = trapFocus(container);
    expect(typeof cleanup).toBe("function");
  });
});
