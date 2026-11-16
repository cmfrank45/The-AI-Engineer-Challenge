/**
 * Tiny client for the FastAPI backend in /api.
 *
 * Where requests go:
 *  - If NEXT_PUBLIC_API_URL is set, we use it (e.g. http://localhost:8000, or a
 *    separately deployed backend like https://my-backend.vercel.app).
 *  - Otherwise, in `next dev` we default to http://localhost:8000.
 *  - Otherwise (a production build with no URL set) we use relative paths
 *    ("/api/chat"), which works when frontend and backend share one domain.
 *
 * NEXT_PUBLIC_* values are inlined at build time, so changing the variable
 * requires a rebuild / redeploy.
 */
const DEFAULT_DEV_API_URL = "http://localhost:8000";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development" ? DEFAULT_DEV_API_URL : "")
).replace(/\/+$/, ""); // drop trailing slashes so we never build "//api/chat"

/** Shape of a successful POST /api/chat response. */
interface ChatResponse {
  reply: string;
}

/**
 * Pull a human-readable message out of a FastAPI error response.
 * HTTPException returns `{ detail: "..." }`; validation errors (422) return
 * `{ detail: [{ msg: "..." }, ...] }`.
 */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail) && body.detail[0]?.msg) {
      return body.detail[0].msg;
    }
  } catch {
    // Body wasn't JSON — fall through to the generic message.
  }
  return `Request failed with status ${response.status}`;
}

/**
 * GET /api/health. Resolves true when the backend answers {"status": "ok"},
 * false on any network error, timeout, or unexpected response.
 */
export async function checkHealth(timeoutMs = 5000): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return false;
    const body = await response.json();
    return body?.status === "ok";
  } catch {
    return false;
  }
}

/**
 * POST /api/chat with a single user message and return the assistant's reply.
 * Throws an Error with a readable message if the request fails.
 */
export async function sendChatMessage(message: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
  } catch {
    throw new Error(
      "Couldn't reach the backend. Is it running and is the API URL correct?",
    );
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const body = (await response.json()) as ChatResponse;
  return body.reply ?? "";
}
