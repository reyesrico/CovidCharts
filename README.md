# Covid Charts

## Vision
To provide charts to show if your country / state / city is reaching the flatten curve.

## Where Data Is Coming From?

We are using [COVID-19 API](https://covid-api.com/) which provides data sourced from Johns Hopkins CSSE [https://github.com/CSSEGISandData/COVID-19](https://github.com/CSSEGISandData/COVID-19).

> **Note:** API data covers through **March 9, 2023**. All date ranges are anchored to that cutoff.

## Inspiration
Living happily depends on how we are in our inner lives - our thoughts, emotions, beliefs and desires. Having a spiritual dimension means finding a sense of inner peace - both peace of mind and peace in the heart. It also means allowing our inner values to guide how we interact with the world around us - our concern for others, our connection with the natural world and our interest in making a positive contribution to society.

<hr />

## What You Can Do

**Select a Country** (or State/Province, or City) from the dropdown to load charts. Use the time-range buttons (1M / 3M / 6M / 1Y / ALL) to adjust how much history is shown.

### Charts & Features

| Feature | Description |
|---|---|
| **Total & Incremental** | Area charts for Confirmed and Deaths totals, plus daily incremental values |
| **Stats Cards** | Quick-glance totals: Confirmed, Deaths, Recovered, Active |
| **Compare** | Side-by-side comparison with a second country |
| **Make Your Own Chart** | Pick any combination of metrics, apply a local date range (1W–ALL), rendered as gradient area fills |
| **Projections – Holt-Winters** | Triple exponential smoothing forecast. Choose metric and number of weeks ahead (1W–12W). Forecast line extends as a red dashed line past the last historical data point |
| **Covid Predictions (CNN)** | In-browser 1D-CNN model (TensorFlow.js). Train on historical data and predict future values. Extend the forecast incrementally |

<hr />

## Try It!
Covid Charts: [https://reyesrico.github.io/CovidCharts/](https://reyesrico.github.io/CovidCharts)

<hr />

## Tech Stack

- React 16 + TypeScript, Vite
- Recharts v2 (ComposedChart, Area, Line, ReferenceLine)
- TensorFlow.js (in-browser CNN)
- Holt-Winters triple exponential smoothing (custom inline implementation)
- SCSS, react-select, dayjs, lodash

<hr />

## About
Author: [Carlos Reyes-Rico (Carlos Reyes)](https://stuffie.azurewebsites.net/PM_Carlos-Reyes2.html)

More Info: [Here](https://stuffie.azurewebsites.net/About_Init.aspx)
