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
import { createUser, updateUser, UserFormState } from "../actions";
import { useLanguage } from "@/context/LanguageContext";

export type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
};

type Props = {
  open: boolean;
  user: UserRow | null;
  onClose: () => void;
};

export default function UserFormDialog({ open, user, onClose }: Props) {
  const { t } = useLanguage();
  const isEdit = user !== null;

  const action = isEdit
    ? updateUser.bind(null, user.id)
    : createUser;

  const [state, formAction, pending] = useActionState<UserFormState, FormData>(action, null);

  useEffect(() => {
    if (state && "ok" in state) onClose();
  }, [state, onClose]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form action={formAction}>
        <DialogTitle>{isEdit ? t.users.editUser : t.users.addUser2}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {state && "error" in state && (
              <Alert severity="error">{state.error}</Alert>
            )}
            <TextField
              name="firstName"
              label={t.users.firstName}
              required
              fullWidth
              defaultValue={user?.firstName ?? ""}
              autoFocus
            />
            <TextField
              name="lastName"
              label={t.users.lastNameFull}
              required
              fullWidth
              defaultValue={user?.lastName ?? ""}
            />
            <TextField
              name="email"
              label={t.users.email}
              type="email"
              required
              fullWidth
              defaultValue={user?.email ?? ""}
            />
            <TextField
              name="password"
              label={isEdit ? t.users.newPasswordHint : t.users.password}
              type="password"
              required={!isEdit}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={pending}>
            {t.users.cancel}
          </Button>
          <Button type="submit" variant="contained" disabled={pending} startIcon={pending ? <CircularProgress size={16} color="inherit" /> : null}>
            {isEdit ? t.users.save : t.users.add}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
