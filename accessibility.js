/**
 * CarbonLens - Accessibility Module
 * ARIA live region management, keyboard navigation, and focus helpers.
 * @module accessibility
 */

"use strict";

/**
 * Announces a message to screen readers via an ARIA live region.
 * @param {string} message - Message to announce
 * @param {"polite"|"assertive"} priority - Announcement priority
 */
function announceToScreenReader(message, priority = "polite") {
  if (typeof document === "undefined") return;
  const id = `sr-announce-${priority}`;
  let region = document.getElementById(id);
  if (!region) {
    region = document.createElement("div");
    region.id = id;
    region.setAttribute("aria-live", priority);
    region.setAttribute("aria-atomic", "true");
    region.setAttribute("role", priority === "assertive" ? "alert" : "status");
    Object.assign(region.style, {
      position: "absolute", width: "1px", height: "1px",
      padding: "0", overflow: "hidden", clip: "rect(0,0,0,0)",
      whiteSpace: "nowrap", border: "0",
    });
    document.body.appendChild(region);
  }
  region.textContent = "";
  requestAnimationFrame(() => { region.textContent = message; });
}

/**
 * Traps keyboard focus within a modal or panel element.
 * @param {HTMLElement} container - The element to trap focus within
 * @returns {Function} Cleanup function to remove the trap
 */
function trapFocus(container) {
  if (typeof document === "undefined") return () => {};
  const focusable = container.querySelectorAll(
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return () => {};
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  function handleKeydown(e) {
    if (e.key !== "Tab") return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  container.addEventListener("keydown", handleKeydown);
  first.focus();
  return () => container.removeEventListener("keydown", handleKeydown);
}

/**
 * Sets ARIA attributes on a slider input for screen reader support.
 * @param {HTMLInputElement} input - The range input element
 * @param {string} label - Human-readable label
 * @param {string} unit - Unit of measurement (e.g. "km", "kWh")
 */
function enhanceSliderAccessibility(input, label, unit) {
  if (!input) return;
  input.setAttribute("aria-label", `${label} in ${unit}`);
  input.setAttribute("aria-valuemin", input.min || "0");
  input.setAttribute("aria-valuemax", input.max || "100");
  input.setAttribute("aria-valuenow", input.value);
  input.setAttribute("aria-valuetext", `${input.value} ${unit}`);
  input.addEventListener("input", () => {
    input.setAttribute("aria-valuenow", input.value);
    input.setAttribute("aria-valuetext", `${input.value} ${unit}`);
  });
}

/**
 * Returns a WCAG 2.1 contrast-safe text color for a given background hex.
 * @param {string} hexColor - Background color in hex (e.g. "#1D9E75")
 * @returns {"#000000"|"#ffffff"} Safe foreground color
 */
function getContrastColor(hexColor) {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance > 0.179 ? "#000000" : "#ffffff";
}

/**
 * Checks if the user prefers reduced motion.
 * @returns {boolean}
 */
function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { announceToScreenReader, trapFocus, enhanceSliderAccessibility, getContrastColor, prefersReducedMotion };
}
