/**
 * Seed script — development and QA use ONLY.
 *
 * Deletes ALL accounts and activity records, then inserts synthetic data
 * spanning Jan 2020 – Jun 2026 (78 monthly snapshots × 8 accounts).
 *
 * NEVER run this against a production database. See CLAUDE.md for details.
 *
 * Usage:
 *   npx tsx scripts/seed-test-data.ts --confirm
 */

import mongoose from "mongoose";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// ─── Load .env ────────────────────────────────────────────────────────────────

function loadEnvFile(): void {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    const raw = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = raw;
  }
}

loadEnvFile();

// ─── Safety gate ─────────────────────────────────────────────────────────────

if (!process.argv.includes("--confirm")) {
  const url = process.env.MONGO_URL ?? "(not set)";
  const db = process.env.MONGO_DB_NAME ?? "(not set)";
  console.error(`
╔══════════════════════════════════════════════════════════════╗
║       ⚠  DESTRUCTIVE OPERATION — READ CAREFULLY  ⚠          ║
╚══════════════════════════════════════════════════════════════╝

This script PERMANENTLY DELETES all accounts and activity data,
then replaces them with synthetic test fixtures.

  MONGO_URL:     ${url}
  MONGO_DB_NAME: ${db}

If this is your production database, stop immediately.

Re-run with --confirm only against a test or dev database:
  npx tsx scripts/seed-test-data.ts --confirm
`);
  process.exit(1);
}

// ─── Models ───────────────────────────────────────────────────────────────────

import Account from "../lib/db/models/account";
import Activity from "../lib/db/models/activity";

// ─── Deterministic PRNG (LCG) ────────────────────────────────────────────────

class PRNG {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0;
  }
  next(): number {
    this.s = (Math.imul(this.s, 1664525) + 1013904223) >>> 0;
    return this.s / 0x100000000;
  }
  nextNormal(): number {
    const u1 = Math.max(this.next(), 1e-10);
    const u2 = this.next();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}

const rng = new PRNG(42);

// ─── Market returns: Jan 2020 – Jun 2026 (78 monthly values) ─────────────────
// Captures the COVID crash, 2020-2021 bull run, 2022 bear market, and subsequent recovery.

const MARKET_RETURNS = [
  // 2020 — COVID crash in Mar, strong recovery through year end
   0.020, -0.080, -0.130,  0.130,  0.050,  0.020,
   0.060,  0.070, -0.040, -0.030,  0.110,  0.050,
  // 2021 — broad bull market with a brief Sep dip
   0.030,  0.030,  0.040,  0.050,  0.020,  0.030,
   0.030,  0.030, -0.050,  0.070, -0.020,  0.040,
  // 2022 — rate-hike bear market
  -0.050, -0.030, -0.030, -0.090, -0.080, -0.050,
   0.090, -0.040, -0.090,  0.080,  0.050, -0.060,
  // 2023 — recovery, AI-driven momentum
   0.060, -0.030,  0.030,  0.020,  0.010,  0.060,
   0.030, -0.020, -0.050, -0.030,  0.090,  0.050,
  // 2024 — continued growth, brief Apr dip
   0.020,  0.050,  0.030, -0.040,  0.050,  0.040,
   0.010,  0.020,  0.020, -0.010,  0.060,  0.020,
  // 2025 — tariff shock in Mar-Apr, sharp May rebound
   0.030,  0.020, -0.060, -0.080,  0.120,  0.050,
   0.020,  0.030,  0.010,  0.020,  0.020,  0.020,
  // 2026 Jan–Jun
   0.050, -0.030,  0.040,  0.080, -0.030,  0.020,
];

// ─── Ticker simulation parameters ────────────────────────────────────────────

interface TickerParams {
  beta: number;        // sensitivity to the market return series
  extra: number;       // monthly alpha (extra return beyond market)
  vol: number;         // idiosyncratic monthly volatility (std dev)
  startPrice: number;
}

const TICKERS: Record<string, TickerParams> = {
  AAPL: { beta: 1.20, extra: 0.005, vol: 0.060, startPrice:  75.00 },
  MSFT: { beta: 1.10, extra: 0.006, vol: 0.050, startPrice: 158.00 },
  VTI:  { beta: 1.00, extra: 0.000, vol: 0.010, startPrice: 148.00 },
  AMZN: { beta: 1.30, extra: 0.003, vol: 0.080, startPrice:  95.00 },
  BND:  { beta:-0.10, extra: 0.002, vol: 0.010, startPrice:  87.00 },
  VXUS: { beta: 0.85, extra:-0.001, vol: 0.030, startPrice:  55.00 },
  TSLA: { beta: 2.00, extra: 0.008, vol: 0.180, startPrice:  95.00 },
  NVDA: { beta: 1.80, extra: 0.015, vol: 0.140, startPrice:  65.00 },
  META: { beta: 1.50, extra: 0.004, vol: 0.140, startPrice: 215.00 },
};

function generatePriceSeries(ticker: string): number[] {
  const p = TICKERS[ticker];
  const prices: number[] = [p.startPrice];
  for (const mktReturn of MARKET_RETURNS) {
    const r = p.beta * mktReturn + p.extra + p.vol * rng.nextNormal();
    prices.push(Math.max(prices[prices.length - 1] * (1 + r), 0.01));
  }
  return prices.slice(0, 78); // one price per month date
}

// ─── Date generation ──────────────────────────────────────────────────────────

function generateMonthlyDates(): string[] {
  const dates: string[] = [];
  for (let y = 2020; y <= 2026; y++) {
    const maxM = y === 2026 ? 6 : 12;
    for (let m = 1; m <= maxM; m++) {
      dates.push(`${y}-${String(m).padStart(2, "0")}-01`);
    }
  }
  return dates;
}

// ─── Non-investment value series ──────────────────────────────────────────────

function generateCheckingValues(): number[] {
  let bal = 4500;
  const vals = [bal];
  for (let i = 1; i < 78; i++) {
    // Paychecks in, bills out — slow upward drift with high noise
    bal = Math.max(800, bal + 200 + 1400 * rng.nextNormal());
    vals.push(Math.round(bal));
  }
  return vals;
}

function generateHYSAValues(): number[] {
  let bal = 12000;
  const vals = [bal];
  for (let i = 1; i < 78; i++) {
    const contrib = 350 + (i / 77) * 250; // contributions grow over time
    const interest = bal * (0.045 / 12);   // 4.5% APY
    bal += contrib + interest + 100 * rng.nextNormal();
    vals.push(Math.round(Math.max(bal, 0)));
  }
  return vals;
}

function generateMortgageValues(): number[] {
  const rate = 0.04 / 12;
  const payment = 1050; // minimum + modest extra principal
  let bal = 178000;
  const vals = [bal];
  for (let i = 1; i < 78; i++) {
    if (bal <= 0) { vals.push(0); continue; }
    const interest = bal * rate;
    const principal = Math.min(payment - interest, bal);
    bal = Math.max(bal - principal, 0);
    vals.push(Math.round(bal));
  }
  return vals;
}

function generateCarLoanValues(): number[] {
  const rate = 0.057 / 12;
  const term = 60; // 5-year loan, fully paid Jan 2025
  const payment = (22000 * rate) / (1 - Math.pow(1 + rate, -term));
  let bal = 22000;
  const vals = [bal];
  for (let i = 1; i < 78; i++) {
    if (bal <= 0) { vals.push(0); continue; }
    const interest = bal * rate;
    const principal = Math.min(payment - interest, bal);
    bal = Math.max(bal - principal, 0);
    vals.push(Math.round(bal));
  }
  return vals;
}

function generateCreditCardValues(): number[] {
  const vals = [1200];
  for (let i = 1; i < 78; i++) {
    const month = i % 12;
    // Seasonal pattern: spikes Nov–Jan from holiday spending, lower mid-year
    const seasonal = [2800, 3200, 1800, 900, 700, 550, 600, 750, 900, 1100, 2000, 3400][month];
    const noise = Math.abs(650 * rng.nextNormal());
    vals.push(Math.round(Math.min(5000, Math.max(0, seasonal + noise))));
  }
  return vals;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const MONGO_URL = process.env.MONGO_URL;
  const MONGO_DB_NAME = process.env.MONGO_DB_NAME;

  if (!MONGO_URL) throw new Error("MONGO_URL is not set");
  if (!MONGO_DB_NAME) throw new Error("MONGO_DB_NAME is not set");

  console.log(`Connecting to ${MONGO_URL} / ${MONGO_DB_NAME} ...`);
  await mongoose.connect(MONGO_URL, { dbName: MONGO_DB_NAME });
  console.log("Connected.\n");

  const [{ deletedCount: da }, { deletedCount: dact }] = await Promise.all([
    Account.deleteMany({}),
    Activity.deleteMany({}),
  ]);
  console.log(`Cleared ${da} account(s) and ${dact} activity record(s).`);

  const dates = generateMonthlyDates(); // 78 entries
  const lastIdx = dates.length - 1;

  // Build price series for every ticker up front
  const prices: Record<string, number[]> = {};
  for (const ticker of Object.keys(TICKERS)) {
    prices[ticker] = generatePriceSeries(ticker);
  }

  // Non-investment series
  const checkingVals   = generateCheckingValues();
  const hysaVals       = generateHYSAValues();
  const mortgageVals   = generateMortgageValues();
  const carLoanVals    = generateCarLoanValues();
  const creditCardVals = generateCreditCardValues();

  // Investment account definitions: fixed quantities, prices shift each month
  const investmentDefs = [
    {
      name: "Fidelity Brokerage",
      holdings: [
        { ticker: "AAPL", quantity: 60 },
        { ticker: "MSFT", quantity: 30 },
        { ticker: "VTI",  quantity: 50 },
        { ticker: "AMZN", quantity: 80 },
      ],
    },
    {
      name: "Vanguard Roth IRA",
      holdings: [
        { ticker: "VTI",  quantity: 90  },
        { ticker: "BND",  quantity: 100 },
        { ticker: "VXUS", quantity: 120 },
      ],
    },
    {
      name: "Robinhood",
      holdings: [
        { ticker: "TSLA", quantity: 15 },
        { ticker: "NVDA", quantity: 25 },
        { ticker: "META", quantity: 10 },
      ],
    },
  ];

  function investmentValueAt(
    def: (typeof investmentDefs)[number],
    i: number
  ): number {
    return def.holdings.reduce(
      (sum, h) => sum + h.quantity * prices[h.ticker][i],
      0
    );
  }

  // ── Create accounts ─────────────────────────────────────────────────────────

  const [checking, hysa, fidelity, vanguard, robinhood, mortgage, creditCard, carLoan] =
    await Promise.all([
      Account.create({
        name: "Chase Checking",
        type: "cash",
        balance: checkingVals[lastIdx],
        currentValue: checkingVals[lastIdx],
        holdings: [],
      }),
      Account.create({
        name: "Marcus High-Yield Savings",
        type: "cash",
        balance: hysaVals[lastIdx],
        currentValue: hysaVals[lastIdx],
        holdings: [],
      }),
      Account.create({
        name: "Fidelity Brokerage",
        type: "investment",
        currentValue: investmentValueAt(investmentDefs[0], lastIdx),
        holdings: investmentDefs[0].holdings.map((h) => ({
          ticker: h.ticker,
          quantity: h.quantity,
          pricePerUnit: parseFloat(prices[h.ticker][lastIdx].toFixed(2)),
        })),
      }),
      Account.create({
        name: "Vanguard Roth IRA",
        type: "investment",
        currentValue: investmentValueAt(investmentDefs[1], lastIdx),
        holdings: investmentDefs[1].holdings.map((h) => ({
          ticker: h.ticker,
          quantity: h.quantity,
          pricePerUnit: parseFloat(prices[h.ticker][lastIdx].toFixed(2)),
        })),
      }),
      Account.create({
        name: "Robinhood",
        type: "investment",
        currentValue: investmentValueAt(investmentDefs[2], lastIdx),
        holdings: investmentDefs[2].holdings.map((h) => ({
          ticker: h.ticker,
          quantity: h.quantity,
          pricePerUnit: parseFloat(prices[h.ticker][lastIdx].toFixed(2)),
        })),
      }),
      Account.create({
        name: "Chase Mortgage",
        type: "liability",
        balance: mortgageVals[lastIdx],
        currentValue: mortgageVals[lastIdx],
        holdings: [],
      }),
      Account.create({
        name: "Chase Freedom Unlimited",
        type: "liability",
        balance: creditCardVals[lastIdx],
        currentValue: creditCardVals[lastIdx],
        holdings: [],
      }),
      Account.create({
        name: "Honda Civic Loan",
        type: "liability",
        balance: carLoanVals[lastIdx],
        currentValue: carLoanVals[lastIdx],
        holdings: [],
      }),
    ]);

  console.log("Created 8 accounts.");

  const accountsByDef = [
    { def: investmentDefs[0], doc: fidelity },
    { def: investmentDefs[1], doc: vanguard },
    { def: investmentDefs[2], doc: robinhood },
  ];

  // ── Generate activity records ────────────────────────────────────────────────

  const activityDocs: object[] = [];

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const recordedAt = new Date(date + "T12:00:00Z");

    activityDocs.push(
      { accountId: checking._id,   value: checkingVals[i],   holdings: [], date, recordedAt },
      { accountId: hysa._id,       value: hysaVals[i],       holdings: [], date, recordedAt },
      { accountId: mortgage._id,   value: mortgageVals[i],   holdings: [], date, recordedAt },
      { accountId: creditCard._id, value: creditCardVals[i], holdings: [], date, recordedAt },
      { accountId: carLoan._id,    value: carLoanVals[i],    holdings: [], date, recordedAt },
    );

    for (const { def, doc } of accountsByDef) {
      const holdingSnaps = def.holdings.map((h) => ({
        ticker: h.ticker,
        quantity: h.quantity,
        pricePerUnit: parseFloat(prices[h.ticker][i].toFixed(2)),
      }));
      const value = holdingSnaps.reduce((sum, h) => sum + h.quantity * h.pricePerUnit, 0);
      activityDocs.push({ accountId: doc._id, value, holdings: holdingSnaps, date, recordedAt });
    }
  }

  await Activity.insertMany(activityDocs);
  console.log(
    `Inserted ${activityDocs.length} activity records ` +
    `(${dates.length} months × 8 accounts).`
  );

  // ── Summary ──────────────────────────────────────────────────────────────────

  const totalAssets =
    checkingVals[lastIdx] +
    hysaVals[lastIdx] +
    investmentValueAt(investmentDefs[0], lastIdx) +
    investmentValueAt(investmentDefs[1], lastIdx) +
    investmentValueAt(investmentDefs[2], lastIdx);

  const totalLiabilities =
    mortgageVals[lastIdx] + creditCardVals[lastIdx] + carLoanVals[lastIdx];

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  console.log(`
Final snapshot (${dates[lastIdx]}):
  Chase Checking              ${fmt(checkingVals[lastIdx])}
  Marcus HYSA                 ${fmt(hysaVals[lastIdx])}
  Fidelity Brokerage          ${fmt(investmentValueAt(investmentDefs[0], lastIdx))}
  Vanguard Roth IRA           ${fmt(investmentValueAt(investmentDefs[1], lastIdx))}
  Robinhood                   ${fmt(investmentValueAt(investmentDefs[2], lastIdx))}
  ─────────────────────────────────────────
  Total assets                ${fmt(totalAssets)}
  Chase Mortgage              ${fmt(mortgageVals[lastIdx])}
  Chase Freedom Unlimited     ${fmt(creditCardVals[lastIdx])}
  Honda Civic Loan            ${fmt(carLoanVals[lastIdx])}
  Total liabilities           ${fmt(totalLiabilities)}
  ─────────────────────────────────────────
  Net worth                   ${fmt(totalAssets - totalLiabilities)}
`);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
