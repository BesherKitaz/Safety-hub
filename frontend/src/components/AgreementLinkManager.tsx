import { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlined from "@mui/icons-material/EditOutlined";
import api from "../lib/api";

export type AgreementLink = {
  id: string;
  title: string;
  url: string;
  displayText: string | null;
};

type LinkDraft = {
  title: string;
  url: string;
  displayText: string;
};

// Agreement links are edited as drafts so incomplete input never mutates saved rows.
const emptyDraft: LinkDraft = { title: "", url: "", displayText: "" };
const errorMessage = (error: unknown) =>
  axios.isAxiosError(error)
    ? error.response?.data?.error?.message ?? "Unable to manage agreement links."
    : "Unable to manage agreement links.";

export default function AgreementLinkManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [links, setLinks] = useState<AgreementLink[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<LinkDraft>(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadLinks = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/user/agreement-links");
      setLinks(response.data.data);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void loadLinks();
  }, [open]);

  const openEditor = (link?: AgreementLink) => {
    setEditingId(link?.id ?? null);
    setDraft(link
      ? { title: link.title, url: link.url, displayText: link.displayText ?? "" }
      : emptyDraft);
    setError("");
    setEditorOpen(true);
  };

  const saveLink = async () => {
    if (!draft.title.trim() || !draft.url.trim()) {
      setError("Title and link are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: draft.title,
        url: draft.url,
        displayText: draft.displayText || null,
      };
      if (editingId) await api.put(`/api/user/agreement-links/${editingId}`, payload);
      else await api.post("/api/user/agreement-links", payload);
      setEditorOpen(false);
      await loadLinks();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const deleteLink = async (link: AgreementLink) => {
    if (!window.confirm(`Delete “${link.title}”?`)) return;
    setError("");
    try {
      await api.delete(`/api/user/agreement-links/${link.id}`);
      setLinks((current) => current.filter((item) => item.id !== link.id));
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Manage agreement links</DialogTitle>
        <DialogContent dividers>
          {error && !editorOpen && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {loading ? (
            <Typography color="text.secondary">Loading agreement links…</Typography>
          ) : (
            <List disablePadding>
              {links.map((link) => (
                <ListItem
                  key={link.id}
                  divider
                  secondaryAction={
                    <Stack direction="row">
                      <Tooltip title="Edit">
                        <IconButton aria-label={`Edit ${link.title}`} onClick={() => openEditor(link)}>
                          <EditOutlined />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" aria-label={`Delete ${link.title}`} onClick={() => void deleteLink(link)}>
                          <DeleteOutlineRounded />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={link.title}
                    secondary={link.displayText || link.url}
                    slotProps={{ secondary: { noWrap: true } }}
                  />
                </ListItem>
              ))}
              <ListItem sx={{ justifyContent: "center", py: 2 }}>
                <Tooltip title="Add agreement link">
                  <IconButton color="primary" size="large" aria-label="Add agreement link" onClick={() => openEditor()}>
                    <AddRounded />
                  </IconButton>
                </Tooltip>
              </ListItem>
            </List>
          )}
        </DialogContent>
        <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={editorOpen} onClose={() => !saving && setEditorOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editingId ? "Edit agreement link" : "Add agreement link"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                autoFocus
                required
                label="Title"
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              />
              <TextField
                required
                label="Link"
                type="url"
                value={draft.url}
                onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))}
              />
              <TextField
                label="Display text (optional)"
                value={draft.displayText}
                onChange={(event) => setDraft((current) => ({ ...current, displayText: event.target.value }))}
                multiline
                minRows={2}
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={() => void saveLink()} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
