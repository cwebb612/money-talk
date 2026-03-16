"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AccountDetail from "../../../../components/accounts/AccountDetail";
import { AccountFormData } from "../../../../components/accounts/AccountForm";

interface AccountData {
  _id: string;
  userId: string;
  name: string;
  type: "cash" | "stock" | "crypto" | "liability";
  institutionUrl?: string;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/accounts/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setAccount(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-sm" style={{ color: "var(--color-muted)" }}>
          ← Dashboard
        </Link>
        <button
          onClick={async () => {
            if (!confirm("Delete this account?")) return;
            await fetch(`/api/accounts/${id}`, { method: "DELETE" });
            router.push("/");
          }}
          className="text-xs"
          style={{ color: "var(--color-muted)" }}
        >
          Delete
        </button>
      </div>
      <AccountDetail account={account} onUpdate={handleUpdate} />
    </div>
  );
}
