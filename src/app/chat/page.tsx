"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
import SendIcon from "@mui/icons-material/Send";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";

type Message = { id: string; role: "user" | "assistant"; content: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const MODELS = [
  { id: "qwen2:0.5b", label: "Qwen2 0.5B", hint: "kiire, inglise keel" },
  { id: "llama3.2:3b", label: "Llama 3.2 3B", hint: "eesti keel" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState(MODELS[0].id);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    const history = [...messages, userMsg];
    const assistantId = `a-${Date.now()}`;

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
        body: JSON.stringify({
          model,
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
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
  }, [input, messages, streaming]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
              {msg.content || (streaming && msg.role === "assistant"
                ? <CircularProgress size={12} color="inherit" sx={{ opacity: 0.6 }} />
                : null)}
            </Paper>
          </Box>
        ))}
        <div ref={bottomRef} />
      </Box>

      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end", flexShrink: 0 }}>
        <TextField
          fullWidth
          multiline
          maxRows={5}
          size="small"
          placeholder="Kirjuta sõnum… (Enter saadab, Shift+Enter uus rida)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={streaming}
        />
        {streaming ? (
          <Tooltip title="Peata">
            <IconButton onClick={handleStop} color="error" sx={{ mb: 0.25 }}>
              <CircularProgress size={20} color="inherit" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Saada (Enter)">
            <span>
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={!input.trim()}
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
