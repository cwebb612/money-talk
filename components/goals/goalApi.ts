import { GoalDTO, GoalFields, GoalStatus } from "../../lib/utils/goals";

async function send(url: string, method: string, payload?: unknown): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: payload ? { "Content-Type": "application/json" } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Something went wrong");
  }
  return res;
}

export async function createGoal(fields: GoalFields): Promise<GoalDTO> {
  return (await send("/api/goals", "POST", fields)).json();
}

export async function updateGoal(id: string, patch: Partial<GoalFields> & { status?: GoalStatus }): Promise<GoalDTO> {
  return (await send(`/api/goals/${id}`, "PATCH", patch)).json();
}

export async function deleteGoal(id: string): Promise<void> {
  await send(`/api/goals/${id}`, "DELETE");
}

export async function reorderGoals(ids: string[]): Promise<void> {
  await send("/api/goals/order", "PUT", { ids });
}
