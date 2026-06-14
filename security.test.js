/**
 * CarbonLens - Security Module Tests
 */
"use strict";

const { escapeHTML, validateRange, sanitizeCalculatorInputs, getCSPContent, createRateLimiter } = require("./security");

describe("escapeHTML", () => {
  test("escapes < and > characters", () => {
    expect(escapeHTML("<script>")).toBe("&lt;script&gt;");
  });
  test("escapes ampersand", () => {
    expect(escapeHTML("A & B")).toBe("A &amp; B");
  });
  test("escapes double quotes", () => {
    expect(escapeHTML('"hello"')).toBe("&quot;hello&quot;");
  });
  test("escapes single quotes", () => {
    expect(escapeHTML("it's")).toBe("it&#039;s");
  });
  test("handles null safely", () => {
    expect(escapeHTML(null)).toBe("");
  });
  test("handles undefined safely", () => {
    expect(escapeHTML(undefined)).toBe("");
  });
  test("leaves safe strings unchanged", () => {
    expect(escapeHTML("Hello World 123")).toBe("Hello World 123");
  });
  test("converts numbers to string", () => {
    expect(escapeHTML(42)).toBe("42");
  });
});

describe("validateRange", () => {
  test("returns valid for number within range", () => {
    const r = validateRange(50, 0, 100);
    expect(r.valid).toBe(true);
    expect(r.value).toBe(50);
    expect(r.error).toBeNull();
  });
  test("returns invalid for NaN", () => {
    const r = validateRange("abc", 0, 100);
    expect(r.valid).toBe(false);
    expect(r.value).toBeNull();
  });
  test("returns invalid for below min", () => {
    const r = validateRange(-1, 0, 100);
    expect(r.valid).toBe(false);
  });
  test("returns invalid for above max", () => {
    const r = validateRange(101, 0, 100);
    expect(r.valid).toBe(false);
  });
  test("accepts boundary min", () => {
    expect(validateRange(0, 0, 100).valid).toBe(true);
  });
  test("accepts boundary max", () => {
    expect(validateRange(100, 0, 100).valid).toBe(true);
  });
  test("parses string numbers", () => {
    expect(validateRange("75", 0, 100).value).toBe(75);
  });
  test("error message included when invalid", () => {
    const r = validateRange(200, 0, 100);
    expect(r.error).toBeTruthy();
  });
});

describe("sanitizeCalculatorInputs", () => {
  const valid = {
    carKm: 800, flightHours: 2, publicKm: 200,
    electricityKwh: 300, lpgCylinders: 2,
    dietMultiplier: 2.2, monthlyOrders: 8,
  };

  test("returns valid true for correct inputs", () => {
    expect(sanitizeCalculatorInputs(valid).valid).toBe(true);
  });
  test("returns sanitized data object on success", () => {
    expect(sanitizeCalculatorInputs(valid).data).not.toBeNull();
  });
  test("returns valid false for out-of-range value", () => {
    const r = sanitizeCalculatorInputs({ ...valid, carKm: -999 });
    expect(r.valid).toBe(false);
  });
  test("errors object contains the failing field", () => {
    const r = sanitizeCalculatorInputs({ ...valid, carKm: -999 });
    expect(r.errors).toHaveProperty("carKm");
  });
  test("data is null when validation fails", () => {
    const r = sanitizeCalculatorInputs({ ...valid, carKm: -999 });
    expect(r.data).toBeNull();
  });
  test("accepts zero values for all fields", () => {
    const zeros = { carKm: 0, flightHours: 0, publicKm: 0, electricityKwh: 0, lpgCylinders: 0, dietMultiplier: 1.0, monthlyOrders: 0 };
    expect(sanitizeCalculatorInputs(zeros).valid).toBe(true);
  });
});

describe("getCSPContent", () => {
  test("returns a non-empty string", () => {
    expect(typeof getCSPContent()).toBe("string");
    expect(getCSPContent().length).toBeGreaterThan(0);
  });
  test("includes default-src directive", () => {
    expect(getCSPContent()).toContain("default-src");
  });
  test("includes connect-src for anthropic API", () => {
    expect(getCSPContent()).toContain("api.anthropic.com");
  });
  test("blocks object-src", () => {
    expect(getCSPContent()).toContain("object-src 'none'");
  });
});

describe("createRateLimiter", () => {
  test("allows calls within limit", () => {
    const limiter = createRateLimiter(3, 60000);
    expect(limiter.check().allowed).toBe(true);
    expect(limiter.check().allowed).toBe(true);
    expect(limiter.check().allowed).toBe(true);
  });
  test("blocks calls exceeding limit", () => {
    const limiter = createRateLimiter(2, 60000);
    limiter.check();
    limiter.check();
    expect(limiter.check().allowed).toBe(false);
  });
  test("blocked result includes waitSeconds", () => {
    const limiter = createRateLimiter(1, 60000);
    limiter.check();
    const result = limiter.check();
    expect(result.waitSeconds).toBeGreaterThan(0);
  });
  test("reset allows calls again", () => {
    const limiter = createRateLimiter(1, 60000);
    limiter.check();
    limiter.reset();
    expect(limiter.check().allowed).toBe(true);
  });
});
