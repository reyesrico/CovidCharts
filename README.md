# CovidCharts

**Live:** [reyesrico.github.io/CovidCharts](https://reyesrico.github.io/CovidCharts)

A data-visualization platform for exploring COVID-19 trends by country, state/province, and city — with in-browser forecasting and machine-learning predictions.

> **Data note:** Johns Hopkins CSSE via [covid-api.com](https://covid-api.com) — historical data through **March 9, 2023**.

---

## Features

| Section | What it does |
|---|---|
| **Country selector** | Pick any country; if it has states/provinces or cities, additional dropdowns appear automatically |
| **Time range** | 1M / 3M / 6M / 1Y / ALL — anchored to the last available data date |
| **Stats cards** | Confirmed, Deaths, Recovered, Active — with latest-period delta |
| **Total chart** | Area chart of cumulative Confirmed + Deaths |
| **Incremental chart** | Daily new cases and deaths |
| **Compare** | Side-by-side comparison with a second country |
| **Make Your Own Chart** | Pick any combination of 8 metrics, local date range (1W–ALL), gradient area fills |
| **Projections – Holt-Winters** | Triple exponential smoothing; choose metric & weeks ahead (1W–12W); red dashed forecast line |
| **Covid Predictions (CNN)** | In-browser 1D-CNN via TensorFlow.js; live training progress bar; autoregressive forecast extension |
| **Save Default** | Save current country + state to localStorage; restored automatically on next visit |
| **8 Languages** | English, Español, Français, Português, 中文, हिन्दी, العربية, Русский — language switcher in header |

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 16 + TypeScript, Vite 5 |
| Charts | Recharts v2 — `ComposedChart`, `Area`, `Line`, `ReferenceLine` |
| Styling | SCSS modules, CSS custom properties |
| ML | TensorFlow.js 2 (1D-CNN, in-browser) |
| Forecasting | Custom Holt-Winters triple exponential smoothing (ES module safe) |
| i18n | i18next + react-i18next |
| Utilities | dayjs, lodash, react-select |
| Deploy | GitHub Pages via `gh-pages` |

---

## Getting Started

```bash
npm install
npm start          # dev server → http://localhost:5173
npm run build      # production build → dist/
npm run deploy     # build + push to gh-pages branch
```

---

## Flatten-Curve Examples

Try these locations to see well-documented curve patterns:

- **Germany** — early flattening
- **South Korea** — rapid containment
- **United States → New York → New York** — city-level detail

---

## Author

[Carlos Reyes-Rico](http://stuffie.azurewebsites.net/PM_Carlos-Reyes2.html) · [@reyesrico](https://twitter.com/reyesrico)

