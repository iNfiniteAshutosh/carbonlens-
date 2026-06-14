/**
 * CarbonLens - Security Module
 * Handles input sanitization, validation, and Content Security Policy helpers.
 * @module security
 */

"use strict";

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * @param {*} value - Raw user input
 * @returns {string} Sanitized string safe for HTML insertion
 */
function escapeHTML(value) {
  const str = String(value ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validates that a value is a finite number within an allowed range.
 * @param {*} value - Value to validate
 * @param {number} min - Minimum allowed value (inclusive)
 * @param {number} max - Maximum allowed value (inclusive)
 * @returns {{ valid: boolean, value: number|null, error: string|null }}
 */
function validateRange(value, min, max) {
  const num = parseFloat(value);
  if (isNaN(num) || !isFinite(num)) {
    return { valid: false, value: null, error: "Must be a valid number" };
  }
  if (num < min || num > max) {
    return { valid: false, value: null, error: `Must be between ${min} and ${max}` };
  }
  return { valid: true, value: num, error: null };
}

/**
 * Sanitizes all calculator form inputs before processing.
 * @param {Object} raw - Raw form values
 * @returns {{ valid: boolean, data: Object|null, errors: Object }}
 */
function sanitizeCalculatorInputs(raw) {
  const rules = {
    carKm:          { min: 0, max: 10000 },
    flightHours:    { min: 0, max: 200 },
    publicKm:       { min: 0, max: 10000 },
    electricityKwh: { min: 0, max: 5000 },
    lpgCylinders:   { min: 0, max: 50 },
    dietMultiplier: { min: 0.5, max: 5.0 },
    monthlyOrders:  { min: 0, max: 200 },
  };

  const errors = {};
  const data = {};
  let valid = true;

  for (const [field, rule] of Object.entries(rules)) {
    const result = validateRange(raw[field], rule.min, rule.max);
    if (!result.valid) {
      errors[field] = result.error;
      valid = false;
    } else {
      data[field] = result.value;
    }
  }

  return { valid, data: valid ? data : null, errors };
}

/**
 * Generates a Content Security Policy meta tag string.
 * @returns {string} CSP content attribute value
 */
function getCSPContent() {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "connect-src https://api.anthropic.com",
    "img-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
  ].join("; ");
}

/**
 * Rate limiter to prevent API abuse.
 * @param {number} maxCalls - Max calls allowed in the window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {{ check: Function, reset: Function }}
 */
function createRateLimiter(maxCalls = 5, windowMs = 60000) {
  let calls = [];
  return {
    check() {
      const now = Date.now();
      calls = calls.filter((t) => now - t < windowMs);
      if (calls.length >= maxCalls) {
        const waitMs = windowMs - (now - calls[0]);
        return { allowed: false, waitSeconds: Math.ceil(waitMs / 1000) };
      }
      calls.push(now);
      return { allowed: true, waitSeconds: 0 };
    },
    reset() { calls = []; },
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { escapeHTML, validateRange, sanitizeCalculatorInputs, getCSPContent, createRateLimiter };
}
