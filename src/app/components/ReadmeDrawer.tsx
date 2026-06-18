"use client";

import { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ReadmeDialog({ open, onClose }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || content) return;
    setLoading(true);
    fetch("/api/readme")
      .then((r) => r.json())
      .then((d) => setContent(d.content))
      .finally(() => setLoading(false));
  }, [open, content]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      slotProps={{ paper: { sx: { width: "95vw", height: "95vh" } } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", fontWeight: 700 }}>
        README
        <IconButton onClick={onClose} size="small" sx={{ ml: "auto" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ overflowY: "auto" }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        {content && (
          <Box
            sx={{
              maxWidth: 900,
              mx: "auto",
              "& h1": { fontSize: "1.5rem", fontWeight: 700, mt: 3, mb: 1 },
              "& h2": { fontSize: "1.2rem", fontWeight: 700, mt: 3, mb: 1, borderBottom: "1px solid", borderColor: "divider", pb: 0.5 },
              "& h3": { fontSize: "1rem", fontWeight: 700, mt: 2, mb: 0.5 },
              "& p": { mb: 1.5, lineHeight: 1.7 },
              "& pre": {
                bgcolor: "action.hover",
                borderRadius: 1,
                p: 1.5,
                overflowX: "auto",
                fontSize: "0.78rem",
                fontFamily: "monospace",
                mb: 1.5,
              },
              "& code": {
                bgcolor: "action.hover",
                borderRadius: 0.5,
                px: 0.5,
                fontSize: "0.82em",
                fontFamily: "monospace",
              },
              "& pre code": { bgcolor: "transparent", p: 0 },
              "& ul, & ol": { pl: 3, mb: 1.5 },
              "& li": { mb: 0.5 },
              "& a": { color: "primary.main" },
              "& hr": { border: "none", borderTop: "1px solid", borderColor: "divider", my: 2 },
              "& table": { width: "100%", borderCollapse: "collapse", mb: 1.5, fontSize: "0.85rem" },
              "& th": { textAlign: "left", borderBottom: "2px solid", borderColor: "divider", pb: 0.5, pr: 2, fontWeight: 700 },
              "& td": { borderBottom: "1px solid", borderColor: "divider", py: 0.5, pr: 2 },
              "& blockquote": { borderLeft: "3px solid", borderColor: "primary.main", pl: 2, ml: 0, color: "text.secondary" },
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
