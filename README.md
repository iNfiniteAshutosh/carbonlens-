# 🌱 CarbonLens — AI-Powered Carbon Footprint Awareness Platform

> **PromptWars Virtual — Main Challenge 3**
> Design a solution that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://carbonlenss.netlify.app/)
[![Tests](https://img.shields.io/badge/Tests-Jest-blue)](./calculator.test.js)
[![License](https://img.shields.io/badge/License-MIT-yellow)](./LICENSE)

---

## 🎯 Problem Statement

Most individuals have no visibility into how their daily choices — driving, diet, electricity usage — contribute to CO₂ emissions. CarbonLens makes this personal, visual, and actionable.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧮 **Carbon Calculator** | Sliders for transport, energy, diet & shopping — instant CO₂ results |
| 🤖 **AI Insights** | Claude AI analyzes your specific numbers and gives personalized tips |
| 📊 **Visual Dashboard** | Breakdown bars, 6-month trend chart, carbon score |
| 🌍 **Action Pledges** | Commit to habits, track monthly CO₂ savings & tree equivalents |
| 📱 **Responsive Design** | Works on mobile and desktop |

---

## 🏗️ Architecture

```
carbonlens/
├── index.html          # Single-file frontend app (HTML + CSS + JS)
├── calculator.js       # Core calculation logic (Node.js module)
├── calculator.test.js  # Jest unit tests (40+ test cases)
├── package.json        # Dependencies and test scripts
└── README.md           # This file
```

**Why single-file?**
The frontend is a dependency-free single `index.html` for maximum portability, zero build steps, and instant deployment anywhere.

---

## 🧪 Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Watch mode during development
npm run test:watch
```

### Test Coverage

The test suite covers:
- ✅ Input validation & sanitization (boundary values, type errors, range errors)
- ✅ Transport emission calculations (car, flight, public transport)
- ✅ Home energy calculations (electricity, LPG)
- ✅ Lifestyle emissions (diet multipliers, shopping)
- ✅ Total footprint aggregation & scoring
- ✅ Trend data generation
- ✅ Pledge savings calculations
- ✅ Emission factor constants
- ✅ Edge cases (zero inputs, invalid types, out-of-range values)

---

## 🔬 Emission Factors & Methodology

| Source | Factor | Reference |
|---|---|---|
| Car (petrol, India) | 0.21 kg CO₂/km | IPCC / India GHG Platform |
| Flight (economy) | 90 kg CO₂/hour | Carbon Independent |
| Electricity (India grid) | 0.82 kg CO₂/kWh | CEA India 2023 |
| LPG cylinder (14.2 kg) | 14.9 kg CO₂ | MoPNG India |
| Online delivery order | 4.5 kg CO₂ | McKinsey Sustainability |
| India avg per capita | 1,900 kg CO₂/year | World Bank 2023 |

---

## 🤖 AI Integration

CarbonLens uses the **Anthropic Claude API** (`claude-sonnet-4-6`) to:
1. Receive the user's complete emission breakdown
2. Identify the top 2-3 highest impact areas
3. Generate 3 specific, personalized, India-contextualized recommendations
4. Return structured JSON for clean UI rendering

The AI prompt is designed to give actionable advice relevant to Indian users (LPG, metro commutes, local food choices).

---

## 🚀 Deployment

**Live:** https://carbonlenss.netlify.app/

Deployed on Netlify via manual deploy (drag & drop `index.html`). No build process required.

### Deploy your own:
1. Fork this repository
2. Go to [netlify.com](https://netlify.com)
3. Drag the `index.html` file to the deploy area
4. Done — live in seconds!

---

## 🛡️ Security

- All numeric inputs are validated and range-checked before processing
- No user data is stored or transmitted (except the Claude API call)
- Claude API is called client-side with per-session context only
- No cookies, no tracking, no third-party analytics

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 👨‍💻 Author

**Ashutosh Solanki** — Built for PromptWars Virtual, Hack2Skill Challenge 3

> *"Small actions, measured clearly, create big change."*
