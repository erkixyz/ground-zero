"use client";

import { useActionState, useEffect, useState, useRef, useCallback } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import FormLabel from "@mui/material/FormLabel";
import Autocomplete from "@mui/material/Autocomplete";
import { createUser, updateUser, UserFormState } from "../actions";
import { useLanguage } from "@/context/LanguageContext";

export type OrganisationOption = {
  id: string;
  name: string;
  regCode: string | null;
};

export type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  roles: string[];
  organisationId?: string | null;
  organisation?: OrganisationOption | null;
};

const ALL_ROLES = ["GLOBAL_ADMIN", "NOTES_ADMIN", "CLIENTS_ADMIN", "ORG_ADMIN", "USER"] as const;

type Props = {
  open: boolean;
  user: UserRow | null;
  onClose: () => void;
  canEditRole?: boolean;
};

export default function UserFormDialog({ open, user, onClose, canEditRole = true }: Props) {
  const { t } = useLanguage();
  const isEdit = user !== null;

  const action = isEdit ? updateUser.bind(null, user.id) : createUser;
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(action, null);

  const [selectedRoles, setSelectedRoles] = useState<string[]>(user?.roles ?? ["USER"]);
  const [organisationOptions, setOrganisationOptions] = useState<OrganisationOption[]>([]);
  const [organisationInput, setOrganisationInput] = useState("");
  const [organisationValue, setOrganisationValue] = useState<OrganisationOption | null>(null);
  const [organisationLoading, setOrganisationLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedRoles(user?.roles ?? ["USER"]);
      setOrganisationValue(user?.organisation ?? null);
      setOrganisationInput(user?.organisation?.name ?? "");
    }
  }, [open, user]);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const searchOrganisations = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setOrganisationOptions([]); return; }
    setOrganisationLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/organisations/search?q=${encodeURIComponent(q.trim())}`);
        if (res.ok) setOrganisationOptions(await res.json());
      } finally {
        setOrganisationLoading(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    if (state && "ok" in state) onClose();
  }, [state, onClose]);

  const roleKey = (r: string) => (t.users.roleLabels as Record<string, string>)[r] ?? r;

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

            {canEditRole && (
              <Stack>
                <FormLabel component="legend" sx={{ fontSize: 12, mb: 0.5 }}>
                  {t.users.roles}
                </FormLabel>
                <FormGroup>
                  {ALL_ROLES.map((role) => (
                    <FormControlLabel
                      key={role}
                      control={
                        <Checkbox
                          size="small"
                          name="roles"
                          value={role}
                          checked={selectedRoles.includes(role)}
                          onChange={() => toggleRole(role)}
                        />
                      }
                      label={roleKey(role)}
                      sx={{ "& .MuiFormControlLabel-label": { fontSize: 14 } }}
                    />
                  ))}
                </FormGroup>
              </Stack>
            )}

            <input type="hidden" name="organisationId" value={organisationValue?.id ?? ""} />
            <Autocomplete
              options={organisationOptions}
              getOptionLabel={(o) => o.regCode ? `${o.name} (${o.regCode})` : o.name}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              value={organisationValue}
              inputValue={organisationInput}
              loading={organisationLoading}
              onInputChange={(_e, val) => { setOrganisationInput(val); searchOrganisations(val); }}
              onChange={(_e, val) => { setOrganisationValue(val); }}
              noOptionsText={organisationInput.trim() ? t.search.noResults : t.organisations.searchOrganisation}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t.organisations.organisation}
                  placeholder={t.organisations.selectOrganisation}
                />
              )}
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
