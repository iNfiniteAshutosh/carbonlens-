/**
 * CarbonLens - Comprehensive Test Suite
 * Tests all core calculation logic, input validation, and edge cases.
 */

"use strict";

const {
  EMISSION_FACTORS,
  DIET_MULTIPLIERS,
  sanitizeNumericInput,
  calculateTransportEmissions,
  calculateEnergyEmissions,
  calculateLifestyleEmissions,
  calculateTotalFootprint,
  generateTrendData,
  calculatePledgeSavings,
} = require("./calculator");

// ─── sanitizeNumericInput ────────────────────────────────────────────────────

describe("sanitizeNumericInput", () => {
  test("returns valid number within range", () => {
    expect(sanitizeNumericInput(500, 0, 3000, "carKm")).toBe(500);
  });

  test("accepts string numbers", () => {
    expect(sanitizeNumericInput("300", 0, 1000, "elec")).toBe(300);
  });

  test("accepts boundary minimum value", () => {
    expect(sanitizeNumericInput(0, 0, 100, "field")).toBe(0);
  });

  test("accepts boundary maximum value", () => {
    expect(sanitizeNumericInput(100, 0, 100, "field")).toBe(100);
  });

  test("throws TypeError for non-numeric string", () => {
    expect(() => sanitizeNumericInput("abc", 0, 100, "field")).toThrow(TypeError);
  });

  test("throws TypeError for null", () => {
    expect(() => sanitizeNumericInput(null, 0, 100, "field")).toThrow(TypeError);
  });

  test("throws RangeError for value below minimum", () => {
    expect(() => sanitizeNumericInput(-1, 0, 100, "field")).toThrow(RangeError);
  });

  test("throws RangeError for value above maximum", () => {
    expect(() => sanitizeNumericInput(101, 0, 100, "field")).toThrow(RangeError);
  });

  test("error message includes field name", () => {
    expect(() => sanitizeNumericInput("bad", 0, 100, "carKm")).toThrow(/carKm/);
  });
});

// ─── calculateTransportEmissions ────────────────────────────────────────────

describe("calculateTransportEmissions", () => {
  test("calculates car emissions correctly", () => {
    const result = calculateTransportEmissions(1000, 0, 0);
    expect(result.car).toBe(Math.round(1000 * EMISSION_FACTORS.CAR_PER_KM));
  });

  test("calculates flight emissions correctly", () => {
    const result = calculateTransportEmissions(0, 5, 0);
    expect(result.flight).toBe(Math.round(5 * EMISSION_FACTORS.FLIGHT_PER_HOUR));
  });

  test("calculates public transport emissions correctly", () => {
    const result = calculateTransportEmissions(0, 0, 500);
    expect(result.publicTransport).toBe(Math.round(500 * EMISSION_FACTORS.PUBLIC_TRANSPORT_PER_KM));
  });

  test("total equals sum of all transport types", () => {
    const result = calculateTransportEmissions(800, 2, 200);
    expect(result.total).toBe(result.car + result.flight + result.publicTransport);
  });

  test("zero inputs return zero emissions", () => {
    const result = calculateTransportEmissions(0, 0, 0);
    expect(result.total).toBe(0);
    expect(result.car).toBe(0);
    expect(result.flight).toBe(0);
  });

  test("throws on negative car km", () => {
    expect(() => calculateTransportEmissions(-100, 0, 0)).toThrow(RangeError);
  });

  test("returns integer values (Math.round applied)", () => {
    const result = calculateTransportEmissions(333, 1, 111);
    expect(Number.isInteger(result.car)).toBe(true);
    expect(Number.isInteger(result.flight)).toBe(true);
    expect(Number.isInteger(result.total)).toBe(true);
  });
});

// ─── calculateEnergyEmissions ────────────────────────────────────────────────

describe("calculateEnergyEmissions", () => {
  test("calculates electricity emissions correctly", () => {
    const result = calculateEnergyEmissions(300, 0);
    expect(result.electricity).toBe(Math.round(300 * EMISSION_FACTORS.ELECTRICITY_PER_KWH));
  });

  test("calculates LPG emissions correctly", () => {
    const result = calculateEnergyEmissions(0, 2);
    expect(result.lpg).toBe(Math.round(2 * EMISSION_FACTORS.LPG_PER_CYLINDER));
  });

  test("total equals electricity + lpg", () => {
    const result = calculateEnergyEmissions(400, 3);
    expect(result.total).toBe(result.electricity + result.lpg);
  });

  test("zero inputs return zero", () => {
    const result = calculateEnergyEmissions(0, 0);
    expect(result.total).toBe(0);
  });

  test("throws on excessive kWh value", () => {
    expect(() => calculateEnergyEmissions(99999, 0)).toThrow(RangeError);
  });
});

// ─── calculateLifestyleEmissions ─────────────────────────────────────────────

describe("calculateLifestyleEmissions", () => {
  test("vegan diet has lowest emissions", () => {
    const vegan = calculateLifestyleEmissions(DIET_MULTIPLIERS.vegan, 0);
    const meat = calculateLifestyleEmissions(DIET_MULTIPLIERS.meat, 0);
    expect(vegan.diet).toBeLessThan(meat.diet);
  });

  test("calculates shopping emissions correctly", () => {
    const result = calculateLifestyleEmissions(1.0, 10);
    expect(result.shopping).toBe(Math.round(10 * EMISSION_FACTORS.SHOPPING_PER_ORDER));
  });

  test("total equals diet + shopping", () => {
    const result = calculateLifestyleEmissions(2.2, 8);
    expect(result.total).toBe(result.diet + result.shopping);
  });

  test("zero shopping returns only diet emissions", () => {
    const result = calculateLifestyleEmissions(2.2, 0);
    expect(result.shopping).toBe(0);
    expect(result.total).toBe(result.diet);
  });

  test("throws on invalid diet multiplier", () => {
    expect(() => calculateLifestyleEmissions(-1, 5)).toThrow(RangeError);
  });
});

// ─── calculateTotalFootprint ─────────────────────────────────────────────────

describe("calculateTotalFootprint", () => {
  const sampleInput = {
    carKm: 800,
    flightHours: 2,
    publicKm: 200,
    electricityKwh: 300,
    lpgCylinders: 2,
    dietMultiplier: 2.2,
    monthlyOrders: 8,
  };

  test("monthly total equals sum of all categories", () => {
    const result = calculateTotalFootprint(sampleInput);
    const expected =
      result.breakdown.transport +
      result.breakdown.energy +
      result.breakdown.diet +
      result.breakdown.shopping;
    expect(result.monthly).toBe(expected);
  });

  test("annual total equals monthly * 12", () => {
    const result = calculateTotalFootprint(sampleInput);
    expect(result.annual).toBe(result.monthly * 12);
  });

  test("annualTonnes is annual / 1000 rounded to 2dp", () => {
    const result = calculateTotalFootprint(sampleInput);
    expect(result.annualTonnes).toBeCloseTo(result.annual / 1000, 2);
  });

  test("carbon score is between 0 and 100", () => {
    const result = calculateTotalFootprint(sampleInput);
    expect(result.carbonScore).toBeGreaterThanOrEqual(0);
    expect(result.carbonScore).toBeLessThanOrEqual(100);
  });

  test("very low footprint gives high carbon score", () => {
    const lowInput = {
      carKm: 0, flightHours: 0, publicKm: 50,
      electricityKwh: 50, lpgCylinders: 0,
      dietMultiplier: 1.0, monthlyOrders: 1,
    };
    const result = calculateTotalFootprint(lowInput);
    expect(result.carbonScore).toBeGreaterThan(50);
  });

  test("vsIndiaAvgPercent is positive when above average", () => {
    const highInput = {
      carKm: 3000, flightHours: 20, publicKm: 0,
      electricityKwh: 1000, lpgCylinders: 5,
      dietMultiplier: 4.5, monthlyOrders: 50,
    };
    const result = calculateTotalFootprint(highInput);
    expect(result.vsIndiaAvgPercent).toBeGreaterThan(0);
  });

  test("result contains all required fields", () => {
    const result = calculateTotalFootprint(sampleInput);
    expect(result).toHaveProperty("monthly");
    expect(result).toHaveProperty("annual");
    expect(result).toHaveProperty("annualTonnes");
    expect(result).toHaveProperty("vsIndiaAvgPercent");
    expect(result).toHaveProperty("carbonScore");
    expect(result).toHaveProperty("breakdown");
    expect(result).toHaveProperty("details");
  });
});

// ─── generateTrendData ───────────────────────────────────────────────────────

describe("generateTrendData", () => {
  test("returns array of 6 values", () => {
    expect(generateTrendData(500)).toHaveLength(6);
  });

  test("last value equals current monthly (rounded)", () => {
    const result = generateTrendData(500);
    expect(result[5]).toBe(500);
  });

  test("values are decreasing (trend going down)", () => {
    const result = generateTrendData(400);
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i]).toBeGreaterThanOrEqual(result[i + 1]);
    }
  });

  test("all values are integers", () => {
    const result = generateTrendData(333);
    result.forEach((v) => expect(Number.isInteger(v)).toBe(true));
  });

  test("throws on negative input", () => {
    expect(() => generateTrendData(-100)).toThrow(RangeError);
  });
});

// ─── calculatePledgeSavings ──────────────────────────────────────────────────

describe("calculatePledgeSavings", () => {
  const pledges = [
    { id: "p1", text: "Cycle short trips", impact: 18 },
    { id: "p2", text: "Meat-free 2 days/week", impact: 22 },
    { id: "p3", text: "Use public transport", impact: 35 },
    { id: "p4", text: "LED bulbs", impact: 12 },
    { id: "p5", text: "Skip one flight", impact: 40 },
    { id: "p6", text: "Buy local produce", impact: 15 },
  ];

  test("no pledges selected returns zero savings", () => {
    const result = calculatePledgeSavings(pledges, []);
    expect(result.totalSavingKg).toBe(0);
    expect(result.treesEquivalent).toBe(0);
  });

  test("all pledges selected returns correct total", () => {
    const allIds = pledges.map((p) => p.id);
    const result = calculatePledgeSavings(pledges, allIds);
    const expected = pledges.reduce((s, p) => s + p.impact, 0);
    expect(result.totalSavingKg).toBe(expected);
  });

  test("selected count matches number of chosen pledges", () => {
    const result = calculatePledgeSavings(pledges, ["p1", "p3"]);
    expect(result.selectedCount).toBe(2);
  });

  test("total count equals pledges array length", () => {
    const result = calculatePledgeSavings(pledges, []);
    expect(result.totalCount).toBe(pledges.length);
  });

  test("trees equivalent is rounded integer", () => {
    const result = calculatePledgeSavings(pledges, ["p1", "p2"]);
    expect(Number.isInteger(result.treesEquivalent)).toBe(true);
  });

  test("throws if pledges is not an array", () => {
    expect(() => calculatePledgeSavings(null, [])).toThrow(TypeError);
  });

  test("throws if selectedIds is not an array", () => {
    expect(() => calculatePledgeSavings(pledges, null)).toThrow(TypeError);
  });

  test("ignores unknown pledge IDs gracefully", () => {
    const result = calculatePledgeSavings(pledges, ["p999", "p888"]);
    expect(result.selectedCount).toBe(0);
    expect(result.totalSavingKg).toBe(0);
  });
});

// ─── EMISSION_FACTORS constants ──────────────────────────────────────────────

describe("EMISSION_FACTORS", () => {
  test("all factors are positive numbers", () => {
    Object.entries(EMISSION_FACTORS).forEach(([key, val]) => {
      expect(typeof val).toBe("number");
      expect(val).toBeGreaterThan(0);
    });
  });

  test("India avg annual is 1900 kg", () => {
    expect(EMISSION_FACTORS.INDIA_AVG_ANNUAL_KG).toBe(1900);
  });
});

// ─── DIET_MULTIPLIERS ────────────────────────────────────────────────────────

describe("DIET_MULTIPLIERS", () => {
  test("vegan is the lowest multiplier", () => {
    const values = Object.values(DIET_MULTIPLIERS);
    expect(DIET_MULTIPLIERS.vegan).toBe(Math.min(...values));
  });

  test("heavyMeat is the highest multiplier", () => {
    const values = Object.values(DIET_MULTIPLIERS);
    expect(DIET_MULTIPLIERS.heavyMeat).toBe(Math.max(...values));
  });

  test("all multipliers are positive", () => {
    Object.values(DIET_MULTIPLIERS).forEach((v) => {
      expect(v).toBeGreaterThan(0);
    });
  });
});
