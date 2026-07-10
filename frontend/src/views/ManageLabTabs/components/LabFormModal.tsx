import { useEffect, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';

export type LabFormValues = {
  name: string;
  description: string;
};

type LabFormModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialValues?: LabFormValues;
  onClose: () => void;
  onSubmit: (values: LabFormValues) => void | Promise<void>;
  submitLabel?: string;
};

const emptyValues: LabFormValues = {
  name: '',
  description: '',
};

const LabFormModal = ({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
  submitLabel,
}: LabFormModalProps) => {
  const [values, setValues] = useState<LabFormValues>(emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setValues({
        name: initialValues?.name ?? '',
        description: initialValues?.description ?? '',
      });
      setError(null);
      setSubmitting(false);
    }
  }, [open, initialValues]);

  const handleSubmit = async () => {
    const trimmedName = values.name.trim();

    if (!trimmedName) {
      setError('Lab name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name: trimmedName,
        description: values.description,
      });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Something went wrong while saving the lab.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack spacing={0.5}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {mode === 'create' ? 'Create Lab' : 'Edit Lab'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter the lab name and description.
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Name"
            value={values.name}
            onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
            fullWidth
            required
            autoFocus
          />
          <TextField
            label="Description"
            value={values.description}
            onChange={(event) => setValues((prev) => ({ ...prev, description: event.target.value }))}
            fullWidth
            multiline
            minRows={4}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined" disabled={submitting} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting} sx={{ textTransform: 'none', fontWeight: 800 }}>
          {submitLabel ?? (mode === 'create' ? 'Create' : 'Update')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LabFormModal;

