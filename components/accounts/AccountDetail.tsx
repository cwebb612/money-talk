"use client";

import Card from "../ui/Card";
import ExternalLink from "../ui/ExternalLink";
import NetWorthChart from "../dashboard/NetWorthChart";
import { AccountType } from "../../lib/db/models/account";
import { formatUSD } from "../../lib/utils/money";

const STALE_AFTER_DAYS = 30;

function isStale(date: Date): boolean {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24) > STALE_AFTER_DAYS;
}

interface AccountDoc {
  _id: string;
  userId: string;
  name: string;
  type: AccountType;
  institutionUrl?: string;
  notes?: string;
  balance?: number;
  holdings: { ticker: string; quantity: number; pricePerUnit: number }[];
  currentValue: number;
}

interface AccountDetailProps {
  account: AccountDoc;
  lastUpdated: string | null;
  chartData: { date: string; value: number }[];
}

export default function AccountDetail({ account, lastUpdated, chartData }: AccountDetailProps) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
            {account.name}
          </h2>
          <span
            className="text-sm px-3 py-0.5 rounded-full"
            style={{ backgroundColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            {account.type}
          </span>
          {account.notes && (
            <p className="text-sm mt-3" style={{ color: "var(--color-muted)" }}>
              {account.notes}
            </p>
          )}
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <p className="text-2xl font-bold" style={{ color: "var(--color-yellow)" }}>
            {formatUSD(account.currentValue)}
          </p>
          {lastUpdated && (() => {
            const [y, m, d] = lastUpdated.split("-").map(Number);
            const date = new Date(y, m - 1, d);
            const stale = isStale(date);
            return (
              <p className="text-xs" style={{ color: stale ? "#ef4444" : "var(--color-muted)" }}>
                {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </p>
            );
          })()}
          {account.institutionUrl && (
            <ExternalLink href={account.institutionUrl} className="text-sm mt-1">
              Go To Account
            </ExternalLink>
          )}
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--color-border)", marginLeft: "-1rem", marginRight: "-1rem", paddingTop: "1rem", paddingLeft: "0.5rem", paddingRight: "0.5rem" }}>
        <NetWorthChart data={chartData} label="Value" />
      </div>
    </Card>
  );
}
