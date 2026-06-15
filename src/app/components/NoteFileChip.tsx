"use client";

import { useTransition } from "react";
import Chip from "@mui/material/Chip";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { deleteNoteFile } from "@/app/actions";

type Props = {
  fileId: number;
  noteId: number;
  filename: string;
  url: string;
};

export default function NoteFileChip({ fileId, noteId, filename, url }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <Chip
      icon={<AttachFileIcon />}
      label={filename}
      size="small"
      variant="outlined"
      component="a"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      clickable
      disabled={pending}
      onDelete={() => startTransition(() => deleteNoteFile(noteId, fileId))}
      sx={{
        maxWidth: 200,
        borderColor: "divider",
        color: "text.secondary",
        fontSize: 11,
        "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
      }}
    />
  );
}
