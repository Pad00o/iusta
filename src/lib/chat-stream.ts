export type Message = { role: "user" | "assistant"; content: string };

export type FileAttachment = {
  name: string;
  type: string;
  size: number;
  data: string; // base64
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const SESSION_KEY = "iusta_session_v2";

function readSession(): { userId: string; passwordHash: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s?.user?.id || !s?.passwordHash) return null;
    return { userId: s.user.id, passwordHash: s.passwordHash };
  } catch {
    return null;
  }
}

export async function streamChat({
  messages,
  files,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  files?: FileAttachment[];
  onDelta: (delta: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  try {
    const session = readSession();
    if (!session) {
      onError("Sessione scaduta. Effettua di nuovo l'accesso.");
      return;
    }
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        "x-iusta-user-id": session.userId,
        "x-iusta-password-hash": session.passwordHash,
      },
      body: JSON.stringify({ messages, files }),
    });

    if (resp.status === 401) {
      onError("Non autorizzato. Effettua di nuovo l'accesso.");
      return;
    }

    if (resp.status === 429) {
      onError("Limite di richieste raggiunto. Riprova tra qualche momento.");
      return;
    }
    if (resp.status === 402) {
      onError("Crediti AI esauriti. Contatta l'amministratore.");
      return;
    }
    if (!resp.ok || !resp.body) {
      onError("Errore nella comunicazione con l'agente AI.");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch (e) {
    onError("Errore di connessione. Riprova.");
  }
}
