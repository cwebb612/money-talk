"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import AccountForm, { AccountFormData } from "../../../../components/accounts/AccountForm";
import Card from "../../../../components/ui/Card";

export default function NewAccountPage() {
  const router = useRouter();

  async function handleSubmit(data: AccountFormData) {
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, date: new Date().toLocaleDateString("en-CA") }),
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? "Failed to create account");
    }

    router.push("/");
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
          Add Account
        </h1>
        <Link href="/" className="text-sm" style={{ color: "var(--color-muted)" }}>
          ← Back
        </Link>
      </div>
      <Card>
        <AccountForm onSubmit={handleSubmit} submitLabel="Create Account" />
      </Card>
    </div>
  );
}
