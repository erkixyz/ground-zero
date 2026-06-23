"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

export default function GlobalSearch({ open, onClose }: Props) {
  const { t } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(null);
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

  const hasResults = results && (results.notes.length > 0 || results.users.length > 0);

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
            onKeyDown={(e) => e.key === "Escape" && onClose()}
            sx={{ fontSize: 15 }}
          />
          <Typography variant="caption" sx={{ color: "text.disabled", flexShrink: 0, fontFamily: "monospace" }}>
            {t.search.shortcut}
          </Typography>
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
                    {results.notes.map((note) => (
                      <ListItemButton key={note.id} onClick={() => navigate("/")}>
                        <ListItemIcon sx={{ minWidth: 36, color: "text.secondary" }}>
                          <NoteOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={note.title}
                          secondary={note.content.slice(0, 80) + (note.content.length > 80 ? "…" : "")}
                          slotProps={{
                            primary: { sx: { fontSize: 14, fontWeight: 500 } },
                            secondary: { sx: { fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } },
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
                    {results.users.map((user) => (
                      <ListItemButton key={user.id} onClick={() => navigate("/users")}>
                        <ListItemIcon sx={{ minWidth: 36, color: "text.secondary" }}>
                          <PersonOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${user.firstName} ${user.lastName}`}
                          secondary={user.email}
                          slotProps={{
                            primary: { sx: { fontSize: 14, fontWeight: 500 } },
                            secondary: { sx: { fontSize: 12 } },
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
