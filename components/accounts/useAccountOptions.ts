"use client";

import { useEffect, useState } from "react";

export interface AccountOption {
  _id: string;
  name: string;
}

export function useAccountOptions(): AccountOption[] {
  const [accounts, setAccounts] = useState<AccountOption[]>([]);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data: AccountOption[]) =>
        setAccounts(data.map(({ _id, name }) => ({ _id, name })).sort((a, b) => a.name.localeCompare(b.name)))
      )
      .catch(() => {});
  }, []);

  return accounts;
}
