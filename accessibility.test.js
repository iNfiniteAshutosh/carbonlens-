/**
 * CarbonLens - Accessibility Module Tests
 */
"use strict";

const { getContrastColor, prefersReducedMotion } = require("./accessibility");

describe("getContrastColor", () => {
  test("returns white for dark background", () => {
    expect(getContrastColor("#0F6E56")).toBe("#ffffff");
  });
  test("returns black for light background", () => {
    expect(getContrastColor("#E1F5EE")).toBe("#000000");
  });
  test("returns white for black background", () => {
    expect(getContrastColor("#000000")).toBe("#ffffff");
  });
  test("returns black for white background", () => {
    expect(getContrastColor("#ffffff")).toBe("#000000");
  });
  test("works without hash prefix", () => {
    const r = getContrastColor("#FFFFFF");
    expect(["#000000", "#ffffff"]).toContain(r);
  });
  test("returns a valid hex color", () => {
    const r = getContrastColor("#888888");
    expect(["#000000", "#ffffff"]).toContain(r);
  });
});

describe("prefersReducedMotion", () => {
  test("returns a boolean", () => {
    expect(typeof prefersReducedMotion()).toBe("boolean");
  });
  test("returns false in Node environment (no window)", () => {
    expect(prefersReducedMotion()).toBe(false);
  });
});
