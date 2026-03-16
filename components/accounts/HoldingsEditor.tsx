"use client";

import { useState } from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { formatUSD } from "../../lib/utils/money";

export interface Holding {
  ticker: string;
  quantity: number;
  pricePerUnit: number;
}

type FetchStatus = "idle" | "loading" | "error";

interface HoldingsEditorProps {
  holdings: Holding[];
  onChange: (holdings: Holding[]) => void;
}

export default function HoldingsEditor({ holdings, onChange }: HoldingsEditorProps) {
  const [fetchStatus, setFetchStatus] = useState<FetchStatus[]>(
    () => holdings.map(() => "idle")
  );

  function addRow() {
    onChange([...holdings, { ticker: "", quantity: 0, pricePerUnit: 0 }]);
    setFetchStatus((prev) => [...prev, "idle"]);
  }

  function removeRow(index: number) {
    onChange(holdings.filter((_, i) => i !== index));
    setFetchStatus((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: keyof Holding, value: string | number) {
    const updated = holdings.map((h, i) => (i === index ? { ...h, [field]: value } : h));
    onChange(updated);
  }

  async function fetchPrice(index: number, ticker: string) {
    if (!ticker) return;
    setFetchStatus((prev) => prev.map((s, i) => (i === index ? "loading" : s)));
    try {
      const res = await fetch(`/api/quote/${encodeURIComponent(ticker)}`);
      if (!res.ok) throw new Error();
      const { price } = await res.json();
      updateRow(index, "pricePerUnit", price);
      setFetchStatus((prev) => prev.map((s, i) => (i === index ? "idle" : s)));
    } catch {
      setFetchStatus((prev) => prev.map((s, i) => (i === index ? "error" : s)));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {holdings.map((holding, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            placeholder="Ticker"
            value={holding.ticker}
            onChange={(e) => updateRow(i, "ticker", e.target.value.toUpperCase())}
            onBlur={(e) => fetchPrice(i, e.target.value.toUpperCase())}
            className="w-24"
          />
          <Input
            type="number"
            placeholder="Qty"
            value={holding.quantity || ""}
            onChange={(e) => updateRow(i, "quantity", parseFloat(e.target.value) || 0)}
            className="w-24"
          />
          <span className="text-xs w-24" style={{ color: "var(--color-muted)" }}>
            {fetchStatus[i] === "loading" && "Fetching..."}
            {fetchStatus[i] === "error" && "Not found"}
            {fetchStatus[i] === "idle" && holding.pricePerUnit > 0 && formatUSD(holding.pricePerUnit)}
            {fetchStatus[i] === "idle" && holding.pricePerUnit === 0 && "—"}
          </span>
          <span className="text-xs w-24 text-right" style={{ color: "var(--color-muted)" }}>
            {holding.pricePerUnit > 0 ? formatUSD(holding.quantity * holding.pricePerUnit) : "—"}
          </span>
          <button
            type="button"
            onClick={() => removeRow(i)}
            className="text-xs px-2"
            style={{ color: "var(--color-muted)" }}
          >
            ✕
          </button>
        </div>
      ))}
      <Button type="button" variant="ghost" onClick={addRow} className="self-start text-xs">
        + Add holding
      </Button>
    </div>
  );
}
