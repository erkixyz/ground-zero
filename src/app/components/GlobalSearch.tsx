"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import InputBase from "@mui/material/InputBase";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import NoteOutlinedIcon from "@mui/icons-material/NoteOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

interface NoteResult {
  id: number;
  title: string;
  content: string;
  category: string | null;
}

interface UserResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface SearchResults {
  notes: NoteResult[];
  users: UserResult[];
}

interface Props {
  open: boolean;
  onClose: () => void;
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <Box
            key={i}
            component="mark"
            sx={{ bgcolor: "primary.main", color: "primary.contrastText", borderRadius: "2px", px: "2px" }}
          >
            {part}
          </Box>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function getSnippet(content: string, query: string): string {
  const q = query.trim().toLowerCase();
  const idx = content.toLowerCase().indexOf(q);
  if (idx === -1) return content.slice(0, 80) + (content.length > 80 ? "…" : "");
  const start = Math.max(0, idx - 30);
  const end = Math.min(content.length, idx + q.length + 50);
  return (start > 0 ? "…" : "") + content.slice(start, end) + (end < content.length ? "…" : "");
}

export default function GlobalSearch({ open, onClose }: Props) {
  const { t } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalItems = (results?.notes.length ?? 0) + (results?.users.length ?? 0);
  const usersStart = results?.notes.length ?? 0;

  const flatPaths = useMemo<string[]>(() => {
    if (!results) return [];
    return [
      ...results.notes.map((n) => `/notes/${n.id}`),
      ...results.users.map((u) => `/users/${u.id}`),
    ];
  }, [results]);

  useEffect(() => {
    setActiveIndex(-1);
    itemRefs.current = new Array(totalItems).fill(null);
  }, [totalItems]);

  useEffect(() => {
    if (activeIndex >= 0) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(null);
      setActiveIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data: SearchResults = await res.json();
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const navigate = useCallback(
    (path: string) => {
      onClose();
      router.push(path);
    },
    [onClose, router],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (!flatPaths.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatPaths.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? 0 : i - 1));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        navigate(flatPaths[activeIndex]);
      }
    },
    [flatPaths, activeIndex, onClose, navigate],
  );

  const hasResults = results && totalItems > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 2, mt: "10vh", verticalAlign: "top" } } }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1.5, gap: 1.5 }}>
          {loading ? (
            <CircularProgress size={18} sx={{ flexShrink: 0, color: "text.disabled" }} />
          ) : (
            <SearchIcon sx={{ flexShrink: 0, color: "text.disabled" }} />
          )}
          <InputBase
            inputRef={inputRef}
            fullWidth
            placeholder={t.search.placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            sx={{ fontSize: 15 }}
          />
        </Box>

        {query.trim() && (
          <>
            <Divider />
            {!hasResults && !loading ? (
              <Box sx={{ py: 3, textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "text.disabled" }}>
                  {t.search.noResults}
                </Typography>
              </Box>
            ) : (
              <List dense disablePadding sx={{ pb: 1 }}>
                {results && results.notes.length > 0 && (
                  <>
                    <Typography
                      variant="overline"
                      sx={{ px: 2, pt: 1.5, pb: 0.5, display: "block", color: "text.disabled", fontSize: 10 }}
                    >
                      {t.search.notes}
                    </Typography>
                    {results.notes.map((note, i) => (
                      <ListItemButton
                        key={note.id}
                        ref={(el) => { itemRefs.current[i] = el; }}
                        selected={activeIndex === i}
                        onClick={() => navigate(`/notes/${note.id}`)}
                        onMouseMove={() => setActiveIndex(i)}
                      >
                        <ListItemIcon sx={{ minWidth: 36, color: "text.secondary" }}>
                          <NoteOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Highlight text={note.title} query={query} />}
                          secondary={<Highlight text={getSnippet(note.content, query)} query={query} />}
                          slotProps={{
                            primary: { component: "div", sx: { fontSize: 14, fontWeight: 500 } },
                            secondary: { component: "div", sx: { fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } },
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </>
                )}

                {results && results.users.length > 0 && (
                  <>
                    {results.notes.length > 0 && <Divider sx={{ my: 0.5 }} />}
                    <Typography
                      variant="overline"
                      sx={{ px: 2, pt: 1, pb: 0.5, display: "block", color: "text.disabled", fontSize: 10 }}
                    >
                      {t.search.users}
                    </Typography>
                    {results.users.map((user, i) => (
                      <ListItemButton
                        key={user.id}
                        ref={(el) => { itemRefs.current[usersStart + i] = el; }}
                        selected={activeIndex === usersStart + i}
                        onClick={() => navigate(`/users/${user.id}`)}
                        onMouseMove={() => setActiveIndex(usersStart + i)}
                      >
                        <ListItemIcon sx={{ minWidth: 36, color: "text.secondary" }}>
                          <PersonOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Highlight text={`${user.firstName} ${user.lastName}`} query={query} />}
                          secondary={<Highlight text={user.email} query={query} />}
                          slotProps={{
                            primary: { component: "div", sx: { fontSize: 14, fontWeight: 500 } },
                            secondary: { component: "div", sx: { fontSize: 12 } },
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </>
                )}
              </List>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
