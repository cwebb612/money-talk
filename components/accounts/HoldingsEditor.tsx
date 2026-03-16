"use client";

import Input from "../ui/Input";
import Button from "../ui/Button";
import { formatUSD } from "../../lib/utils/money";

export interface Holding {
  ticker: string;
  quantity: number;
  pricePerUnit: number;
}

interface HoldingsEditorProps {
  holdings: Holding[];
  onChange: (holdings: Holding[]) => void;
}

export default function HoldingsEditor({ holdings, onChange }: HoldingsEditorProps) {
  function addRow() {
    onChange([...holdings, { ticker: "", quantity: 0, pricePerUnit: 0 }]);
  }

  function removeRow(index: number) {
    onChange(holdings.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: keyof Holding, value: string | number) {
    const updated = holdings.map((h, i) => (i === index ? { ...h, [field]: value } : h));
    onChange(updated);
  }

  return (
    <div className="flex flex-col gap-3">
      {holdings.map((holding, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            placeholder="Ticker"
            value={holding.ticker}
            onChange={(e) => updateRow(i, "ticker", e.target.value.toUpperCase())}
            className="w-24"
          />
          <Input
            type="number"
            placeholder="Qty"
            value={holding.quantity || ""}
            onChange={(e) => updateRow(i, "quantity", parseFloat(e.target.value) || 0)}
            className="w-24"
          />
          <Input
            type="number"
            placeholder="Price"
            value={holding.pricePerUnit || ""}
            onChange={(e) => updateRow(i, "pricePerUnit", parseFloat(e.target.value) || 0)}
            className="w-28"
          />
          <span className="text-xs w-24 text-right" style={{ color: "var(--color-muted)" }}>
            {formatUSD(holding.quantity * holding.pricePerUnit)}
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
