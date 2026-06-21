"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import PushPinIcon from "@mui/icons-material/PushPin";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import DeleteButton from "./DeleteButton";
import SendNoteButton from "./SendNoteButton";
import NoteFileChip from "./NoteFileChip";

type NoteFile = {
  id: number;
  filename: string;
  key: string;
  size: number;
  mimeType: string;
  url: string;
};

export type Note = {
  id: number;
  title: string;
  content: string;
  category: string | null;
  pinned: boolean;
  createdAt: string;
  files: NoteFile[];
  author: { firstName: string; lastName: string } | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  isiklik: "Isiklik",
  too: "Töö",
  ideed: "Ideed",
  muu: "Muu",
};

export default function NoteCard({ note }: { note: Note }) {
  return (
    <Card sx={note.pinned ? { borderColor: "primary.dark", borderWidth: 1, borderStyle: "solid" } : {}}>
      <CardContent sx={{ pb: "12px !important" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              {note.pinned && (
                <PushPinIcon sx={{ fontSize: 15, color: "primary.main", flexShrink: 0 }} />
              )}
              <Typography sx={{ fontWeight: 600 }} noWrap>
                {note.title}
              </Typography>
            </Box>

            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mt: 0.5, whiteSpace: "pre-wrap" }}
            >
              {note.content}
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1.5 }}>
              <Chip
                label={new Date(note.createdAt).toLocaleString("et-EE", { timeZone: "Europe/Tallinn" })}
                size="small"
                variant="outlined"
                sx={{ borderColor: "divider", color: "text.secondary", fontSize: 11 }}
              />
              <Chip
                icon={<PersonOutlinedIcon sx={{ fontSize: "13px !important" }} />}
                label={note.author ? `${note.author.firstName} ${note.author.lastName}` : "Anonüümne"}
                size="small"
                variant="outlined"
                sx={{ borderColor: "divider", color: "text.secondary", fontSize: 11 }}
              />
              {note.category && (
                <Chip
                  label={CATEGORY_LABELS[note.category] ?? note.category}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontSize: 11 }}
                />
              )}
              {note.files.map((file) => (
                <NoteFileChip
                  key={file.id}
                  fileId={file.id}
                  noteId={note.id}
                  filename={file.filename}
                  url={file.url}
                />
              ))}
            </Box>
          </Box>
          <SendNoteButton noteId={note.id} />
          <DeleteButton id={note.id} />
        </Box>
      </CardContent>
    </Card>
  );
}
