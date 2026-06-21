"use client";

import { useTransition } from "react";
import Chip from "@mui/material/Chip";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { deleteNoteFile } from "@/app/actions";
import { useToast } from "./ToastProvider";

type Props = {
  fileId: number;
  noteId: number;
  filename: string;
  url: string;
};

export default function NoteFileChip({ fileId, noteId, filename, url }: Props) {
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();

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
      onDelete={() =>
        startTransition(async () => {
          await deleteNoteFile(noteId, fileId);
          showToast("Fail kustutatud", "error");
        })
      }
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
