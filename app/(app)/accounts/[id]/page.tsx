"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AccountDetail from "../../../../components/accounts/AccountDetail";
import { AccountFormData } from "../../../../components/accounts/AccountForm";
import Card from "../../../../components/ui/Card";
import NetWorthChart from "../../../../components/dashboard/NetWorthChart";
import HoldingsPieChart from "../../../../components/accounts/HoldingsPieChart";

interface AccountData {
  _id: string;
  userId: string;
  name: string;
  type: "cash" | "investment" | "liability";
  institutionUrl?: string;
  notes?: string;
  balance?: number;
  holdings: { ticker: string; quantity: number; pricePerUnit: number }[];
  currentValue: number;
  createdAt: string;
  updatedAt: string;
}

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [account, setAccount] = useState<AccountData | null>(null);
  const [chartData, setChartData] = useState<{ date: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  function fetchActivity() {
    fetch(`/api/accounts/${id}/activity`)
      .then((r) => r.json())
      .then(setChartData)
      .catch(() => {});
  }

  useEffect(() => {
    fetch(`/api/accounts/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setAccount(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetchActivity();
  }, [id]);

  async function handleUpdate(data: AccountFormData) {
    const res = await fetch(`/api/accounts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? "Failed to update");
    }

    const updated = await res.json();
    setAccount(updated);
    fetchActivity();
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center" style={{ color: "var(--color-muted)" }}>
        Loading…
      </div>
    );
  }

  if (!account) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <p style={{ color: "var(--color-muted)" }}>Account not found.</p>
        <Link href="/" className="text-sm mt-2 inline-block" style={{ color: "var(--color-yellow)" }}>
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  async function handleRefreshPrices() {
    const res = await fetch(`/api/accounts/${id}/refresh-prices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: new Date().toLocaleDateString("en-CA") }),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? "Failed to refresh prices");
    }
    const updated = await res.json();
    setAccount(updated);
    fetchActivity();
  }

  async function handleDelete() {
    if (!confirm("Delete this account? This cannot be undone.")) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    router.push("/");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm" style={{ color: "var(--color-muted)" }}>
          ← Dashboard
        </Link>
      </div>
      <div className="flex flex-col gap-6">
        <Card>
          <NetWorthChart data={chartData} label="Value" />
        </Card>
        {account.type === "investment" && (
          <HoldingsPieChart holdings={account.holdings} />
        )}
        <AccountDetail account={account} onUpdate={handleUpdate} onRefreshPrices={handleRefreshPrices} onDelete={handleDelete} />
      </div>
    </div>
  );
}
