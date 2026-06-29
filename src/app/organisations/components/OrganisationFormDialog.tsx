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
import { createOrganisation, updateOrganisation, OrganisationFormState } from "../actions";
import { useLanguage } from "@/context/LanguageContext";
import CountrySelect from "@/app/clients/components/CountrySelect";
import { DEFAULT_COUNTRY } from "@/config";

export type OrganisationRow = {
  id: string;
  name: string;
  regCode: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;
  createdAt: string;
};

type Props = {
  open: boolean;
  organisation: OrganisationRow | null;
  onClose: () => void;
};

export default function OrganisationFormDialog({ open, organisation, onClose }: Props) {
  const { t, locale } = useLanguage();
  const isEdit = organisation !== null;

  const action = isEdit ? updateOrganisation.bind(null, organisation.id) : createOrganisation;
  const [state, formAction, pending] = useActionState<OrganisationFormState, FormData>(action, null);

  useEffect(() => {
    if (state && "ok" in state) onClose();
  }, [state, onClose]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form action={formAction}>
        <DialogTitle>{isEdit ? t.organisations.editOrganisation : t.organisations.addOrganisation2}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {state && "error" in state && (
              <Alert severity="error">{state.error}</Alert>
            )}
            <TextField
              name="name"
              label={t.organisations.name}
              required
              fullWidth
              defaultValue={organisation?.name ?? ""}
              autoFocus
            />
            <TextField
              name="regCode"
              label={t.organisations.regCode}
              fullWidth
              defaultValue={organisation?.regCode ?? ""}
              placeholder="12345678"
            />
            <TextField
              name="street"
              label={t.clients.street}
              fullWidth
              defaultValue={organisation?.street ?? ""}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                name="zip"
                label={t.clients.zip}
                defaultValue={organisation?.zip ?? ""}
                sx={{ width: 160 }}
              />
              <TextField
                name="city"
                label={t.clients.city}
                fullWidth
                defaultValue={organisation?.city ?? ""}
              />
            </Stack>
            <CountrySelect
              label={t.clients.country}
              locale={locale}
              defaultValue={organisation?.country ?? DEFAULT_COUNTRY}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={pending}>
            {t.organisations.cancel}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={pending}
            startIcon={pending ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isEdit ? t.organisations.save : t.organisations.add}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
