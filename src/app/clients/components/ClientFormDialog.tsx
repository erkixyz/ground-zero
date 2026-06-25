"use client";

import { useActionState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { createClient, updateClient, ClientFormState } from "../actions";
import { useLanguage } from "@/context/LanguageContext";

export type ClientRow = {
  id: string;
  name: string;
  regCode: string | null;
  createdAt: string;
};

type Props = {
  open: boolean;
  client: ClientRow | null;
  onClose: () => void;
};

export default function ClientFormDialog({ open, client, onClose }: Props) {
  const { t } = useLanguage();
  const isEdit = client !== null;

  const action = isEdit ? updateClient.bind(null, client.id) : createClient;
  const [state, formAction, pending] = useActionState<ClientFormState, FormData>(action, null);

  useEffect(() => {
    if (state && "ok" in state) onClose();
  }, [state, onClose]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form action={formAction}>
        <DialogTitle>{isEdit ? t.clients.editClient : t.clients.addClient2}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {state && "error" in state && (
              <Alert severity="error">{state.error}</Alert>
            )}
            <TextField
              name="name"
              label={t.clients.name}
              required
              fullWidth
              defaultValue={client?.name ?? ""}
              autoFocus
            />
            <TextField
              name="regCode"
              label={t.clients.regCode}
              fullWidth
              defaultValue={client?.regCode ?? ""}
              placeholder="12345678"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={pending}>
            {t.clients.cancel}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={pending}
            startIcon={pending ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isEdit ? t.clients.save : t.clients.add}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
