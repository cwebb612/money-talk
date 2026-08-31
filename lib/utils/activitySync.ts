import { Types } from "mongoose";
import Account from "../db/models/account";
import Activity from "../db/models/activity";
import { calculateAccountValue } from "./money";

/**
 * Recomputes an account's denormalized balance/holdings/currentValue from
 * whichever activity now has the latest date, after an activity edit or
 * delete. Mirrors the "isLatest" sync the reconcile PUT route performs on
 * write, but is unconditional so it stays correct regardless of which entry
 * changed.
 */
export async function resyncAccountFromActivities(accountId: Types.ObjectId) {
  const account = await Account.findById(accountId);
  if (!account) return;

  const latest = await Activity.findOne({ accountId })
    .sort({ date: -1, recordedAt: -1 })
    .lean();

  if (!latest) {
    if (account.type === "investment") {
      account.holdings = [];
    } else {
      account.balance = 0;
    }
    account.currentValue = 0;
    await account.save();
    return;
  }

  if (account.type === "investment") {
    account.holdings = latest.holdings;
  } else {
    account.balance = latest.value;
  }
  account.currentValue = calculateAccountValue({
    type: account.type,
    balance: latest.value,
    holdings: latest.holdings,
  });
  await account.save();
}
