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
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import UserFormDialog, { UserRow } from "./UserFormDialog";
import { deleteUser } from "../actions";
import { useAuth } from "@/app/components/AuthProvider";

export default function UsersClient({ users }: { users: UserRow[] }) {
  const { user: currentUser } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  const openCreate = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  const openEdit = (user: UserRow) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const closeDialog = useCallback(() => setDialogOpen(false), []);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
    });
  };

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
        <Button variant="contained" startIcon={<PersonAddOutlinedIcon />} onClick={openCreate}>
          Lisa kasutaja
        </Button>
      </Stack>

      {users.length === 0 ? (
        <Typography sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
          Kasutajaid pole. Lisa esimene!
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Eesnimi</TableCell>
                <TableCell>Perenimi</TableCell>
                <TableCell>E-post</TableCell>
                <TableCell>Lisatud</TableCell>
                <TableCell align="right">Toimingud</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => {
                const isSelf = currentUser?.id === user.id;
                return (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.firstName}</TableCell>
                    <TableCell>{user.lastName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>
                      {new Date(user.createdAt).toLocaleDateString("et-EE")}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <IconButton size="small" onClick={() => openEdit(user)} aria-label="Muuda">
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <Tooltip title={isSelf ? "Ei saa iseennast kustutada" : "Kustuta"}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteTarget(user)}
                            disabled={isSelf}
                            sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
                            aria-label="Kustuta"
                          >
                            <DeleteOutlinedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <UserFormDialog open={dialogOpen} user={editingUser} onClose={closeDialog} />

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Kustuta kasutaja</DialogTitle>
        <DialogContent>
          <Typography>
            Kas oled kindel, et soovid kustutada kasutaja{" "}
            <strong>
              {deleteTarget?.firstName} {deleteTarget?.lastName}
            </strong>
            ?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deletePending}>
            Tühista
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deletePending}
            onClick={confirmDelete}
            startIcon={deletePending ? <CircularProgress size={16} color="inherit" /> : null}
          >
            Kustuta
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
