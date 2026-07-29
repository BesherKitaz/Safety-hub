type HistorySnapshotSource = {
  level: number;
  status: string;
  expiryDate: Date | null;
  notes: string | null;
  trainingNodeId: string;
};

export const buildBeforeSnapshotFields = (
  before: HistorySnapshotSource | null,
) => ({
  levelBefore: before?.level ?? null,
  statusBefore: before?.status ?? null,
  expiryDateBefore: before?.expiryDate ?? null,
  notesBefore: before?.notes ?? null,
  trainingNodeIdBefore: before?.trainingNodeId ?? null,
});
