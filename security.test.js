/**
 * CarbonLens - Security Module Tests
 * Full coverage for all security utilities.
 */
"use strict";

const {
  escapeHTML,
  validateRange,
  sanitizeCalculatorInputs,
  getCSPContent,
  createRateLimiter,
} = require("./security");

// ─── escapeHTML ───────────────────────────────────────────────────────────────
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
  test("handles null safely — returns empty string", () => {
    expect(escapeHTML(null)).toBe("");
  });
  test("handles undefined safely — returns empty string", () => {
    expect(escapeHTML(undefined)).toBe("");
  });
  test("leaves safe strings unchanged", () => {
    expect(escapeHTML("Hello World 123")).toBe("Hello World 123");
  });
  test("converts numbers to escaped string", () => {
    expect(escapeHTML(42)).toBe("42");
  });
  test("handles XSS payload", () => {
    expect(escapeHTML('<img src=x onerror=alert(1)>')).not.toContain("<img");
  });
  test("handles multiple special chars in one string", () => {
    const result = escapeHTML('<b class="x">Test & "Check"</b>');
    expect(result).toContain("&lt;");
    expect(result).toContain("&gt;");
    expect(result).toContain("&amp;");
    expect(result).toContain("&quot;");
  });
  test("handles empty string", () => {
    expect(escapeHTML("")).toBe("");
  });
  test("converts boolean to string", () => {
    expect(escapeHTML(true)).toBe("true");
  });
});

// ─── validateRange ────────────────────────────────────────────────────────────
describe("validateRange", () => {
  test("returns valid for number within range", () => {
    const r = validateRange(50, 0, 100);
    expect(r.valid).toBe(true);
    expect(r.value).toBe(50);
    expect(r.error).toBeNull();
  });
  test("returns invalid for NaN input", () => {
    expect(validateRange("abc", 0, 100).valid).toBe(false);
  });
  test("returns invalid for Infinity", () => {
    expect(validateRange(Infinity, 0, 100).valid).toBe(false);
  });
  test("returns invalid for below min", () => {
    expect(validateRange(-1, 0, 100).valid).toBe(false);
  });
  test("returns invalid for above max", () => {
    expect(validateRange(101, 0, 100).valid).toBe(false);
  });
  test("accepts exact minimum boundary", () => {
    expect(validateRange(0, 0, 100).valid).toBe(true);
  });
  test("accepts exact maximum boundary", () => {
    expect(validateRange(100, 0, 100).valid).toBe(true);
  });
  test("parses valid string numbers", () => {
    expect(validateRange("75", 0, 100).value).toBe(75);
  });
  test("error message is non-null when invalid", () => {
    expect(validateRange(200, 0, 100).error).toBeTruthy();
  });
  test("value is null when invalid", () => {
    expect(validateRange("bad", 0, 100).value).toBeNull();
  });
  test("handles float values correctly", () => {
    expect(validateRange(2.5, 0, 10).value).toBe(2.5);
  });
  test("handles negative range", () => {
    expect(validateRange(-5, -10, 0).valid).toBe(true);
  });
});

// ─── sanitizeCalculatorInputs ─────────────────────────────────────────────────
describe("sanitizeCalculatorInputs", () => {
  const valid = {
    carKm: 800, flightHours: 2, publicKm: 200,
    electricityKwh: 300, lpgCylinders: 2,
    dietMultiplier: 2.2, monthlyOrders: 8,
  };

  test("returns valid:true for correct inputs", () => {
    expect(sanitizeCalculatorInputs(valid).valid).toBe(true);
  });
  test("returns data object on success", () => {
    expect(sanitizeCalculatorInputs(valid).data).not.toBeNull();
  });
  test("errors is empty object on success", () => {
    expect(Object.keys(sanitizeCalculatorInputs(valid).errors)).toHaveLength(0);
  });
  test("returns valid:false for out-of-range carKm", () => {
    expect(sanitizeCalculatorInputs({ ...valid, carKm: -999 }).valid).toBe(false);
  });
  test("errors object contains the failing field name", () => {
    expect(sanitizeCalculatorInputs({ ...valid, carKm: -999 }).errors).toHaveProperty("carKm");
  });
  test("data is null when validation fails", () => {
    expect(sanitizeCalculatorInputs({ ...valid, carKm: -999 }).data).toBeNull();
  });
  test("accepts zero values for all numeric fields", () => {
    const zeros = { carKm: 0, flightHours: 0, publicKm: 0, electricityKwh: 0, lpgCylinders: 0, dietMultiplier: 1.0, monthlyOrders: 0 };
    expect(sanitizeCalculatorInputs(zeros).valid).toBe(true);
  });
  test("catches invalid flightHours", () => {
    expect(sanitizeCalculatorInputs({ ...valid, flightHours: 999 }).valid).toBe(false);
  });
  test("catches invalid electricityKwh", () => {
    expect(sanitizeCalculatorInputs({ ...valid, electricityKwh: 99999 }).valid).toBe(false);
  });
  test("catches invalid dietMultiplier below min", () => {
    expect(sanitizeCalculatorInputs({ ...valid, dietMultiplier: 0 }).valid).toBe(false);
  });
  test("catches invalid monthlyOrders above max", () => {
    expect(sanitizeCalculatorInputs({ ...valid, monthlyOrders: 999 }).valid).toBe(false);
  });
  test("multiple invalid fields all appear in errors", () => {
    const bad = { ...valid, carKm: -1, flightHours: 999 };
    const result = sanitizeCalculatorInputs(bad);
    expect(result.errors).toHaveProperty("carKm");
    expect(result.errors).toHaveProperty("flightHours");
  });
});

// ─── getCSPContent ────────────────────────────────────────────────────────────
describe("getCSPContent", () => {
  test("returns a non-empty string", () => {
    expect(typeof getCSPContent()).toBe("string");
    expect(getCSPContent().length).toBeGreaterThan(0);
  });
  test("includes default-src directive", () => {
    expect(getCSPContent()).toContain("default-src");
  });
  test("includes connect-src for Anthropic API", () => {
    expect(getCSPContent()).toContain("api.anthropic.com");
  });
  test("blocks object-src", () => {
    expect(getCSPContent()).toContain("object-src 'none'");
  });
  test("restricts base-uri", () => {
    expect(getCSPContent()).toContain("base-uri 'self'");
  });
  test("includes font-src for Google Fonts", () => {
    expect(getCSPContent()).toContain("fonts.gstatic.com");
  });
  test("includes script-src with cdnjs", () => {
    expect(getCSPContent()).toContain("cdnjs.cloudflare.com");
  });
  test("directives are separated by semicolons", () => {
    expect(getCSPContent()).toContain(";");
  });
});

// ─── createRateLimiter ────────────────────────────────────────────────────────
describe("createRateLimiter", () => {
  test("allows calls within limit", () => {
    const limiter = createRateLimiter(3, 60000);
    expect(limiter.check().allowed).toBe(true);
    expect(limiter.check().allowed).toBe(true);
    expect(limiter.check().allowed).toBe(true);
  });
  test("blocks calls exceeding the limit", () => {
    const limiter = createRateLimiter(2, 60000);
    limiter.check();
    limiter.check();
    expect(limiter.check().allowed).toBe(false);
  });
  test("blocked result includes positive waitSeconds", () => {
    const limiter = createRateLimiter(1, 60000);
    limiter.check();
    expect(limiter.check().waitSeconds).toBeGreaterThan(0);
  });
  test("reset allows further calls", () => {
    const limiter = createRateLimiter(1, 60000);
    limiter.check();
    limiter.reset();
    expect(limiter.check().allowed).toBe(true);
  });
  test("uses default maxCalls=5 when not specified", () => {
    const limiter = createRateLimiter(undefined, 60000);
    for (let i = 0; i < 5; i++) limiter.check();
    expect(limiter.check().allowed).toBe(false);
  });
  test("successful check returns waitSeconds of 0", () => {
    const limiter = createRateLimiter(5, 60000);
    expect(limiter.check().waitSeconds).toBe(0);
  });
  test("expired calls are not counted", () => {
    const limiter = createRateLimiter(2, 1); // 1ms window
    limiter.check();
    limiter.check();
    return new Promise(resolve => setTimeout(() => {
      expect(limiter.check().allowed).toBe(true);
      resolve();
    }, 10));
  });
  test("multiple limiters are independent", () => {
    const a = createRateLimiter(1, 60000);
    const b = createRateLimiter(1, 60000);
    a.check();
    expect(b.check().allowed).toBe(true);
  });
});
