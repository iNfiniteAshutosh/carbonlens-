/**
 * CarbonLens - Carbon Footprint Calculator Module
 * Core calculation logic, separated for testability and reuse.
 * @module calculator
 */

"use strict";

/**
 * Emission factors used for CO2 calculations.
 * Sources: IPCC, India GHG Platform, Carbon Independent.
 * @constant {Object}
 */
const EMISSION_FACTORS = {
  /** kg CO2 per km for average petrol car (India) */
  CAR_PER_KM: 0.21,
  /** kg CO2 per flight hour (economy, short-haul avg) */
  FLIGHT_PER_HOUR: 90,
  /** kg CO2 per km for public transport (bus/metro blend) */
  PUBLIC_TRANSPORT_PER_KM: 0.04,
  /** kg CO2 per kWh electricity (India grid avg 2023) */
  ELECTRICITY_PER_KWH: 0.82,
  /** kg CO2 per LPG cylinder (14.2 kg cylinder) */
  LPG_PER_CYLINDER: 14.9,
  /** kg CO2 per online order (packaging + delivery) */
  SHOPPING_PER_ORDER: 4.5,
  /** India average annual per-capita CO2 in kg */
  INDIA_AVG_ANNUAL_KG: 1900,
};

/**
 * Diet multipliers (monthly kg CO2 base = 100kg * multiplier)
 * @constant {Object}
 */
const DIET_MULTIPLIERS = {
  vegan: 1.0,
  vegetarian: 1.5,
  mixed: 2.2,
  meat: 3.3,
  heavyMeat: 4.5,
};

/**
 * Validates and sanitizes a numeric input value.
 * @param {*} value - Raw input value
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {number} Sanitized numeric value
 * @throws {TypeError} If value cannot be converted to a number
 * @throws {RangeError} If value is outside allowed range
 */
function sanitizeNumericInput(value, min, max, fieldName) {
  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new TypeError(`${fieldName} must be a valid number, got: ${value}`);
  }
  if (num < min || num > max) {
    throw new RangeError(`${fieldName} must be between ${min} and ${max}, got: ${num}`);
  }
  return num;
}

/**
 * Calculates monthly carbon emissions from transport.
 * @param {number} carKm - Car travel in km/month
 * @param {number} flightHours - Flight hours/month
 * @param {number} publicKm - Public transport km/month
 * @returns {Object} Transport emissions breakdown in kg CO2
 */
function calculateTransportEmissions(carKm, flightHours, publicKm) {
  const car = sanitizeNumericInput(carKm, 0, 10000, "carKm");
  const flight = sanitizeNumericInput(flightHours, 0, 200, "flightHours");
  const pub = sanitizeNumericInput(publicKm, 0, 10000, "publicKm");

  return {
    car: Math.round(car * EMISSION_FACTORS.CAR_PER_KM),
    flight: Math.round(flight * EMISSION_FACTORS.FLIGHT_PER_HOUR),
    publicTransport: Math.round(pub * EMISSION_FACTORS.PUBLIC_TRANSPORT_PER_KM),
    total: Math.round(
      car * EMISSION_FACTORS.CAR_PER_KM +
      flight * EMISSION_FACTORS.FLIGHT_PER_HOUR +
      pub * EMISSION_FACTORS.PUBLIC_TRANSPORT_PER_KM
    ),
  };
}

/**
 * Calculates monthly carbon emissions from home energy usage.
 * @param {number} electricityKwh - Monthly electricity in kWh
 * @param {number} lpgCylinders - LPG cylinders used per month
 * @returns {Object} Energy emissions breakdown in kg CO2
 */
function calculateEnergyEmissions(electricityKwh, lpgCylinders) {
  const elec = sanitizeNumericInput(electricityKwh, 0, 5000, "electricityKwh");
  const lpg = sanitizeNumericInput(lpgCylinders, 0, 50, "lpgCylinders");

  return {
    electricity: Math.round(elec * EMISSION_FACTORS.ELECTRICITY_PER_KWH),
    lpg: Math.round(lpg * EMISSION_FACTORS.LPG_PER_CYLINDER),
    total: Math.round(
      elec * EMISSION_FACTORS.ELECTRICITY_PER_KWH +
      lpg * EMISSION_FACTORS.LPG_PER_CYLINDER
    ),
  };
}

/**
 * Calculates monthly carbon emissions from diet and shopping.
 * @param {number} dietMultiplier - Diet type multiplier (1.0–4.5)
 * @param {number} monthlyOrders - Online shopping orders per month
 * @returns {Object} Lifestyle emissions breakdown in kg CO2
 */
function calculateLifestyleEmissions(dietMultiplier, monthlyOrders) {
  const multiplier = sanitizeNumericInput(dietMultiplier, 0.5, 5.0, "dietMultiplier");
  const orders = sanitizeNumericInput(monthlyOrders, 0, 200, "monthlyOrders");

  return {
    diet: Math.round(multiplier * 100),
    shopping: Math.round(orders * EMISSION_FACTORS.SHOPPING_PER_ORDER),
    total: Math.round(
      multiplier * 100 +
      orders * EMISSION_FACTORS.SHOPPING_PER_ORDER
    ),
  };
}

/**
 * Calculates total monthly carbon footprint and derived metrics.
 * @param {Object} inputs - All user inputs
 * @param {number} inputs.carKm - Car km/month
 * @param {number} inputs.flightHours - Flight hours/month
 * @param {number} inputs.publicKm - Public transport km/month
 * @param {number} inputs.electricityKwh - Electricity kWh/month
 * @param {number} inputs.lpgCylinders - LPG cylinders/month
 * @param {number} inputs.dietMultiplier - Diet type multiplier
 * @param {number} inputs.monthlyOrders - Shopping orders/month
 * @returns {Object} Complete footprint result with totals and comparisons
 */
function calculateTotalFootprint(inputs) {
  const transport = calculateTransportEmissions(
    inputs.carKm, inputs.flightHours, inputs.publicKm
  );
  const energy = calculateEnergyEmissions(
    inputs.electricityKwh, inputs.lpgCylinders
  );
  const lifestyle = calculateLifestyleEmissions(
    inputs.dietMultiplier, inputs.monthlyOrders
  );

  const monthlyTotal = transport.total + energy.total + lifestyle.total;
  const annualTotal = monthlyTotal * 12;
  const indiaAvgMonthly = EMISSION_FACTORS.INDIA_AVG_ANNUAL_KG / 12;
  const vsIndiaAvgPercent = Math.round(
    ((monthlyTotal - indiaAvgMonthly) / indiaAvgMonthly) * 100
  );

  // Score: 100 = very low footprint, 0 = very high footprint
  const carbonScore = Math.max(0, Math.min(100, Math.round(100 - (monthlyTotal / 500) * 100)));

  return {
    monthly: monthlyTotal,
    annual: annualTotal,
    annualTonnes: parseFloat((annualTotal / 1000).toFixed(2)),
    vsIndiaAvgPercent,
    carbonScore,
    breakdown: {
      transport: transport.total,
      energy: energy.total,
      diet: lifestyle.diet,
      shopping: lifestyle.shopping,
    },
    details: { transport, energy, lifestyle },
  };
}

/**
 * Generates a 6-month historical trend (simulated reduction trend).
 * @param {number} currentMonthly - Current month's kg CO2
 * @returns {number[]} Array of 6 monthly values (oldest to newest)
 */
function generateTrendData(currentMonthly) {
  const val = sanitizeNumericInput(currentMonthly, 0, 100000, "currentMonthly");
  return [
    Math.round(val * 1.18),
    Math.round(val * 1.12),
    Math.round(val * 1.07),
    Math.round(val * 1.03),
    Math.round(val * 1.01),
    Math.round(val),
  ];
}

/**
 * Calculates total CO2 savings from selected pledges.
 * @param {Array<{id: string, impact: number}>} pledges - All available pledges
 * @param {string[]} selectedIds - IDs of pledges the user committed to
 * @returns {Object} Savings summary
 */
function calculatePledgeSavings(pledges, selectedIds) {
  if (!Array.isArray(pledges)) throw new TypeError("pledges must be an array");
  if (!Array.isArray(selectedIds)) throw new TypeError("selectedIds must be an array");

  const selected = pledges.filter((p) => selectedIds.includes(p.id));
  const totalSavingKg = selected.reduce((sum, p) => sum + p.impact, 0);
  const treesEquivalent = Math.round(totalSavingKg / 21); // 1 tree absorbs ~21 kg CO2/month

  return {
    selectedCount: selected.length,
    totalCount: pledges.length,
    totalSavingKg,
    treesEquivalent,
  };
}

module.exports = {
  EMISSION_FACTORS,
  DIET_MULTIPLIERS,
  sanitizeNumericInput,
  calculateTransportEmissions,
  calculateEnergyEmissions,
  calculateLifestyleEmissions,
  calculateTotalFootprint,
  generateTrendData,
  calculatePledgeSavings,
};
