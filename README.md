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
| UI | React 16 + TypeScript, Vite 8 |
| Charts | Recharts v2 — `ComposedChart`, `Area`, `Line`, `ReferenceLine` |
| Styling | SCSS modules, CSS custom properties |
| ML | TensorFlow.js 2 core/layers with CPU and WebGL backends (1D-CNN, in-browser) |
| Forecasting | Custom Holt-Winters triple exponential smoothing (ES module safe) |
| i18n | i18next + react-i18next |
| Utilities | dayjs, lodash, react-select |
| Deploy | GitHub Pages via `gh-pages` |

---

## Getting Started

Use Node.js 22.13+ on the 22.x line, or Node.js 24+ (`nvm use` selects Node 22).

```bash
nvm use
npm ci
npm start          # dev server → http://localhost:5173
npm test           # dependency and TensorFlow regression tests
npm run typecheck
npm run lint
npm run build      # production build → dist/
npm run deploy     # build + push to gh-pages branch
```

TensorFlow runtime modules are pinned to the same version. The umbrella
`@tensorflow/tfjs` package is intentionally excluded: its CLI dependencies pull in
`argparse` 1 and `sprintf-js`, which has no patched release for CVE-2026-97058.
Both prediction components use the shared runtime in `src/helpers/tensorflow.js`.

---

## Flatten-Curve Examples

Try these locations to see well-documented curve patterns:

- **Germany** — early flattening
- **South Korea** — rapid containment
- **United States → New York → New York** — city-level detail

---

## Author

[Carlos Reyes-Rico](http://stuffie.azurewebsites.net/PM_Carlos-Reyes2.html) · [@reyesrico](https://twitter.com/reyesrico)
