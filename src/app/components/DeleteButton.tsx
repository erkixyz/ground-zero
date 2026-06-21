"use client";

import { useTransition } from "react";
import IconButton from "@mui/material/IconButton";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import { deleteNote } from "@/app/actions";
import { useToast } from "./ToastProvider";

export default function DeleteButton({ id }: { id: number }) {
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();

  return (
    <IconButton
      size="small"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await deleteNote(id);
          showToast("Märge kustutatud", "error");
        })
      }
      sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
      aria-label="Kustuta"
    >
      {pending ? (
        <CircularProgress size={16} color="inherit" />
      ) : (
        <DeleteOutlined fontSize="small" />
      )}
    </IconButton>
  );
}
