"use client";

import { useState, useTransition, useCallback } from "react";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import DomainOutlinedIcon from "@mui/icons-material/DomainOutlined";
import Link from "next/link";
import OrganisationFormDialog, { OrganisationRow } from "./OrganisationFormDialog";
import { deleteOrganisation } from "../actions";
import { useLanguage } from "@/context/LanguageContext";

export default function OrganisationsClient({ organisations }: { organisations: OrganisationRow[] }) {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganisationRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrganisationRow | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  const openCreate = () => {
    setEditingOrg(null);
    setDialogOpen(true);
  };

  const openEdit = (org: OrganisationRow) => {
    setEditingOrg(org);
    setDialogOpen(true);
  };

  const closeDialog = useCallback(() => setDialogOpen(false), []);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      await deleteOrganisation(deleteTarget.id);
      setDeleteTarget(null);
    });
  };

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
        <Button variant="contained" startIcon={<DomainOutlinedIcon />} onClick={openCreate}>
          {t.organisations.addOrganisation}
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t.organisations.name}</TableCell>
              <TableCell>{t.organisations.regCode}</TableCell>
              <TableCell>{t.organisations.added}</TableCell>
              <TableCell align="right">{t.organisations.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {organisations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} sx={{ textAlign: "center", color: "text.secondary", py: 4 }}>
                  {t.organisations.empty}
                </TableCell>
              </TableRow>
            ) : organisations.map((org) => (
              <TableRow key={org.id} hover sx={{ cursor: "pointer" }}>
                <TableCell>
                  <Link href={`/organisations/${org.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    {org.name}
                  </Link>
                </TableCell>
                <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>
                  <Link href={`/organisations/${org.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    {org.regCode ?? "—"}
                  </Link>
                </TableCell>
                <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>
                  <Link href={`/organisations/${org.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    {new Date(org.createdAt).toLocaleDateString(t.common.localeCode)}
                  </Link>
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  <IconButton size="small" onClick={() => openEdit(org)} aria-label={t.organisations.edit}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <Tooltip title={t.organisations.delete}>
                    <IconButton
                      size="small"
                      onClick={() => setDeleteTarget(org)}
                      sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
                      aria-label={t.organisations.delete}
                    >
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <OrganisationFormDialog open={dialogOpen} organisation={editingOrg} onClose={closeDialog} />

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t.organisations.deleteTitle}</DialogTitle>
        <DialogContent>
          <Typography>
            {t.organisations.deleteConfirm}{" "}
            <strong>{deleteTarget?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deletePending}>
            {t.organisations.cancel}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deletePending}
            onClick={confirmDelete}
            startIcon={deletePending ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {t.organisations.delete}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
