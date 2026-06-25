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
import AddBusinessOutlinedIcon from "@mui/icons-material/AddBusinessOutlined";
import Link from "next/link";
import ClientFormDialog, { ClientRow } from "./ClientFormDialog";
import { deleteClient } from "../actions";
import { useLanguage } from "@/context/LanguageContext";

export default function ClientsClient({ clients }: { clients: ClientRow[] }) {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientRow | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  const openCreate = () => {
    setEditingClient(null);
    setDialogOpen(true);
  };

  const openEdit = (client: ClientRow) => {
    setEditingClient(client);
    setDialogOpen(true);
  };

  const closeDialog = useCallback(() => setDialogOpen(false), []);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      await deleteClient(deleteTarget.id);
      setDeleteTarget(null);
    });
  };

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
        <Button variant="contained" startIcon={<AddBusinessOutlinedIcon />} onClick={openCreate}>
          {t.clients.addClient}
        </Button>
      </Stack>

      {clients.length === 0 ? (
        <Typography sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
          {t.clients.empty}
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t.clients.name}</TableCell>
                <TableCell>{t.clients.regCode}</TableCell>
                <TableCell>{t.clients.added}</TableCell>
                <TableCell align="right">{t.clients.actions}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} hover sx={{ cursor: "pointer" }}>
                  <TableCell>
                    <Link href={`/clients/${client.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>
                    <Link href={`/clients/${client.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      {client.regCode ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>
                    <Link href={`/clients/${client.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      {new Date(client.createdAt).toLocaleDateString(t.common.localeCode)}
                    </Link>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <IconButton size="small" onClick={() => openEdit(client)} aria-label={t.clients.edit}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <Tooltip title={t.clients.delete}>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteTarget(client)}
                        sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
                        aria-label={t.clients.delete}
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
      )}

      <ClientFormDialog open={dialogOpen} client={editingClient} onClose={closeDialog} />

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t.clients.deleteTitle}</DialogTitle>
        <DialogContent>
          <Typography>
            {t.clients.deleteConfirm}{" "}
            <strong>{deleteTarget?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deletePending}>
            {t.clients.cancel}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deletePending}
            onClick={confirmDelete}
            startIcon={deletePending ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {t.clients.delete}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
