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
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";

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

export default function NoteCard({ note }: { note: Note }) {
  const { t } = useLanguage();

  return (
    <Card sx={note.pinned ? { borderColor: "primary.dark", borderWidth: 1, borderStyle: "solid" } : {}}>
      <CardContent sx={{ pb: "12px !important" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Box
            component={Link}
            href={`/notes/${note.id}`}
            sx={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit", "&:hover .note-title": { color: "primary.main" } }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              {note.pinned && (
                <PushPinIcon sx={{ fontSize: 15, color: "primary.main", flexShrink: 0 }} />
              )}
              <Typography className="note-title" sx={{ fontWeight: 600, transition: "color 0.15s" }} noWrap>
                {note.title}
              </Typography>
            </Box>

            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mt: 0.5, whiteSpace: "pre-wrap" }}
            >
              {note.content}
            </Typography>
          </Box>
          <SendNoteButton noteId={note.id} />
          <DeleteButton id={note.id} />
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1.5 }}>
          <Chip
            label={new Date(note.createdAt).toLocaleString(t.common.localeCode, { timeZone: "Europe/Tallinn" })}
            size="small"
            variant="outlined"
            sx={{ borderColor: "divider", color: "text.secondary", fontSize: 11 }}
          />
          <Chip
            icon={<PersonOutlinedIcon sx={{ fontSize: "13px !important" }} />}
            label={note.author ? `${note.author.firstName} ${note.author.lastName}` : t.notes.anonymous}
            size="small"
            variant="outlined"
            sx={{ borderColor: "divider", color: "text.secondary", fontSize: 11 }}
          />
          {note.category && (
            <Chip
              label={t.notes.categories[note.category as keyof typeof t.notes.categories] ?? note.category}
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
      </CardContent>
    </Card>
  );
}
