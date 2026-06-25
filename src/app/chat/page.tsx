"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../components/AuthProvider";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import SendIcon from "@mui/icons-material/Send";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import HistoryIcon from "@mui/icons-material/History";

type ConfirmCall = { name: string; args: Record<string, unknown> };
type HistoryMsg = { role: string; content: string };
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  pendingConfirm?: {
    calls: ConfirmCall[];
    history: HistoryMsg[];
  };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const HISTORY_LIMIT = 50;

const MODELS = [
  { id: "llama3.2:3b", label: "Llama 3.2 3B", hint: "eesti keel" },
  { id: "qwen2:0.5b", label: "Qwen2 0.5B", hint: "kiire, inglise keel" },
];

function getActionInfo(name: string): { label: string; color: "error" | "warning" } {
  switch (name) {
    case "create_note":  return { label: "Lisa märge",     color: "warning" };
    case "update_note":  return { label: "Muuda märget",   color: "warning" };
    case "delete_note":  return { label: "Kustuta märge",  color: "error" };
    case "create_user":  return { label: "Lisa kasutaja",  color: "warning" };
    case "update_user":  return { label: "Muuda kasutajat", color: "warning" };
    case "delete_user":  return { label: "Kustuta kasutaja", color: "error" };
    default:             return { label: name,             color: "warning" };
  }
}

function describeCallArgs(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "create_note":
      return args.title ? `"${String(args.title)}"` : "";
    case "update_note":
      return `id: ${args.id}${args.title ? `, pealkiri: "${args.title}"` : ""}`;
    case "delete_note":
      return `id: ${args.id}`;
    case "create_user":
      return `${args.firstName} ${args.lastName}${args.email ? ` <${args.email}>` : ""}`;
    case "update_user":
      return `id: ${args.id}`;
    case "delete_user":
      return `id: ${args.id}`;
    default:
      return "";
  }
}

function hasDestructive(calls: ConfirmCall[]): boolean {
  return calls.some((c) => c.name.startsWith("delete_"));
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState(MODELS[0].id);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const savedInputRef = useRef("");

  const awaitingConfirm = messages.some((m) => !!m.pendingConfirm);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_URL}/api/users/${user.id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: { chatInputHistory?: string[] }) => {
        if (Array.isArray(data.chatInputHistory) && data.chatInputHistory.length > 0) {
          inputHistoryRef.current = data.chatInputHistory;
          setInputHistory(data.chatInputHistory);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming || awaitingConfirm) return;

    if (inputHistoryRef.current[inputHistoryRef.current.length - 1] !== text) {
      const updated = [...inputHistoryRef.current, text].slice(-HISTORY_LIMIT);
      inputHistoryRef.current = updated;
      setInputHistory(updated);
      if (user?.id) {
        fetch(`${API_URL}/api/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ chatInputHistory: updated }),
        }).catch(() => {});
      }
    }
    historyIndexRef.current = -1;
    savedInputRef.current = "";

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    const history = [...messages, userMsg];
    const assistantId = `a-${Date.now()}`;
    const sentHistory: HistoryMsg[] = history.map(({ role, content }) => ({ role, content }));

    setMessages([...history, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    setError(null);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: ctrl.signal,
        body: JSON.stringify({ model, messages: sentHistory }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const contentType = res.headers.get("Content-Type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await res.json() as { __type?: string; preview?: string; calls?: ConfirmCall[] };
        if (data.__type === "confirm") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: data.preview ?? "", pendingConfirm: { calls: data.calls ?? [], history: sentHistory } }
                : m,
            ),
          );
          return;
        }
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m,
          ),
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Tundmatu viga";
      setError(msg.includes("unavailable") || msg.includes("503")
        ? "AI teenus pole saadaval. Kontrolli, et Ollama konteinerid töötavad ja mudel on laaditud."
        : msg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, messages, streaming, awaitingConfirm, user, model]);

  const handleConfirm = useCallback(async (msg: Message) => {
    if (!msg.pendingConfirm) return;
    const { calls, history } = msg.pendingConfirm;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id ? { ...m, content: "", pendingConfirm: undefined } : m,
      ),
    );
    setStreaming(true);
    setError(null);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: ctrl.signal,
        body: JSON.stringify({ model, messages: history, confirmedCalls: calls }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const contentType = res.headers.get("Content-Type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await res.json() as { __type?: string; preview?: string; calls?: ConfirmCall[] };
        if (data.__type === "confirm") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msg.id
                ? { ...m, content: data.preview ?? "", pendingConfirm: { calls: data.calls ?? [], history } }
                : m,
            ),
          );
          return;
        }
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id ? { ...m, content: m.content + chunk } : m,
          ),
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const errMsg = err instanceof Error ? err.message : "Tundmatu viga";
      setError(errMsg.includes("unavailable") || errMsg.includes("503")
        ? "AI teenus pole saadaval."
        : errMsg);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, content: "Viga tegevuse täitmisel." } : m,
        ),
      );
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [model]);

  const handleCancel = useCallback((msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, content: "Tegevus tühistati.", pendingConfirm: undefined }
          : m,
      ),
    );
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }

    const ta = e.target as HTMLTextAreaElement;

    if (e.key === "ArrowUp") {
      const cursorAtStart = ta.selectionStart === 0 && ta.selectionEnd === 0;
      if (cursorAtStart || historyIndexRef.current > -1) {
        if (historyIndexRef.current === -1) savedInputRef.current = input;
        const hist = inputHistoryRef.current;
        if (historyIndexRef.current < hist.length - 1) {
          historyIndexRef.current++;
          setInput(hist[hist.length - 1 - historyIndexRef.current]);
        }
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown" && historyIndexRef.current > -1) {
      historyIndexRef.current--;
      const hist = inputHistoryRef.current;
      setInput(historyIndexRef.current === -1
        ? savedInputRef.current
        : hist[hist.length - 1 - historyIndexRef.current]);
      e.preventDefault();
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 64px)",
        maxWidth: 860,
        mx: "auto",
        width: "100%",
        px: 2,
        pb: 2,
        gap: 1.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SmartToyIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>AI Chat</Typography>
          <FormControl size="small">
            <Select
              value={model}
              onChange={(e) => { setModel(e.target.value); setMessages([]); setError(null); }}
              disabled={streaming}
              sx={{ fontSize: 12, "& .MuiSelect-select": { py: 0.5, px: 1.25 } }}
            >
              {MODELS.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>{m.label}</Typography>
                    <Typography variant="caption" color="text.disabled">{m.hint}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Tooltip title="Tühjenda vestlus">
          <span>
            <IconButton onClick={() => { setMessages([]); setError(null); }} disabled={messages.length === 0 && !error}>
              <DeleteOutlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ flexShrink: 0 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 1.5, py: 1 }}>
        {messages.length === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 2, color: "text.disabled" }}>
            <SmartToyIcon sx={{ fontSize: 72, opacity: 0.25 }} />
            <Typography color="text.disabled" align="center">
            Alusta vestlust…
            <br />
            <Typography variant="caption" color="text.disabled">
              AI näeb kõiki märkmeid ja kasutajaid — küsi julgelt
            </Typography>
          </Typography>
          </Box>
        )}

        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              gap: 1,
              alignItems: "flex-start",
            }}
          >
            <Box sx={{ mt: 0.5, color: msg.role === "user" ? "primary.main" : "text.secondary", flexShrink: 0 }}>
              {msg.role === "user"
                ? <PersonOutlinedIcon fontSize="small" />
                : <SmartToyIcon fontSize="small" />}
            </Box>
            <Paper
              elevation={0}
              sx={{
                px: 1.75,
                py: 1.25,
                maxWidth: "78%",
                bgcolor: msg.role === "user" ? "primary.main" : "action.hover",
                color: msg.role === "user" ? "primary.contrastText" : "text.primary",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: 1.6,
              }}
            >
              {msg.content}

              {!msg.content && streaming && msg.role === "assistant" && !msg.pendingConfirm && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={12} color="inherit" sx={{ opacity: 0.6 }} />
                  <Typography variant="caption" sx={{ opacity: 0.6 }}>töötab…</Typography>
                </Box>
              )}

              {msg.pendingConfirm && (
                <Box sx={{ mt: msg.content ? 1.5 : 0 }}>
                  {!msg.content && (
                    <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
                      Tahan teha järgmist:
                    </Typography>
                  )}
                  <Box
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1.5,
                      overflow: "hidden",
                      mb: 1.25,
                    }}
                  >
                    {msg.pendingConfirm.calls.map((call, i) => {
                      const { label, color } = getActionInfo(call.name);
                      const details = describeCallArgs(call.name, call.args);
                      return (
                        <Box
                          key={i}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            px: 1.5,
                            py: 0.875,
                            bgcolor: "background.paper",
                            borderTop: i > 0 ? "1px solid" : "none",
                            borderColor: "divider",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 700, color: `${color}.main`, flexShrink: 0, minWidth: 120 }}
                          >
                            {label}
                          </Typography>
                          {details && (
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              {details}
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color={hasDestructive(msg.pendingConfirm.calls) ? "error" : "primary"}
                      onClick={() => handleConfirm(msg)}
                      disabled={streaming}
                    >
                      Kinnita
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleCancel(msg.id)}
                      disabled={streaming}
                      sx={{ color: "text.secondary", borderColor: "divider" }}
                    >
                      Tühista
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          </Box>
        ))}
        <div ref={bottomRef} />
      </Box>

      {inputHistory.length > 0 && (
        <Box sx={{ flexShrink: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.75, color: "text.disabled" }}>
            <HistoryIcon sx={{ fontSize: 14 }} />
            <Typography variant="caption">Varasemad päringud</Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            {[...inputHistory].reverse().slice(0, 12).map((item, i) => (
              <Chip
                key={i}
                label={item.length > 48 ? item.slice(0, 47) + "…" : item}
                size="small"
                variant="outlined"
                onClick={() => {
                  setInput(item);
                  historyIndexRef.current = -1;
                }}
                disabled={streaming || awaitingConfirm}
                sx={{ cursor: "pointer", maxWidth: 280, fontStyle: item.length > 48 ? "italic" : "normal" }}
              />
            ))}
          </Box>
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end", flexShrink: 0 }}>
        <TextField
          fullWidth
          multiline
          maxRows={5}
          size="small"
          placeholder="Kirjuta sõnum… (Enter saadab, Shift+Enter uus rida)"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            historyIndexRef.current = -1;
          }}
          onKeyDown={handleKeyDown}
          disabled={streaming || awaitingConfirm}
        />
        {streaming ? (
          <Tooltip title="Peata">
            <IconButton onClick={handleStop} color="error" sx={{ mb: 0.25 }}>
              <CircularProgress size={20} color="inherit" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title={awaitingConfirm ? "Kinnita või tühista ootelev tegevus" : "Saada (Enter)"}>
            <span>
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={!input.trim() || awaitingConfirm}
                sx={{ mb: 0.25 }}
              >
                <SendIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
