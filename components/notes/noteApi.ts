import { NoteDTO } from "../../lib/utils/notes";

export interface NoteInput {
  body: string;
  date: string | null;
  accountId?: string | null;
}

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

export async function createNote(input: NoteInput): Promise<NoteDTO> {
  return (await send("/api/notes", "POST", input)).json();
}

export async function updateNote(id: string, input: NoteInput): Promise<NoteDTO> {
  return (await send(`/api/notes/${id}`, "PATCH", input)).json();
}

export async function deleteNote(id: string): Promise<void> {
  await send(`/api/notes/${id}`, "DELETE");
}

export { todayString } from "../../lib/utils/filters";
