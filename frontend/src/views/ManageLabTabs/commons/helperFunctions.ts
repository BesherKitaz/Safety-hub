import type { LabDetail, LabSummary } from "./types";


const safeText = (value?: string | null, fallback = 'Not provided') => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
};

const resolveLabReference = (
  currentLab: LabDetail,
  relatedLab?: LabSummary | null,
  relatedLabId?: string | null,
): LabSummary => {
  const referenceId = relatedLab?.id ?? relatedLabId ?? currentLab.id;

  return {
    id: referenceId,
    name: safeText(relatedLab?.name ?? currentLab.name, referenceId),
    description: relatedLab?.description ?? currentLab.description ?? null,
  };
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return 'Not provided';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not provided';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};


export { safeText, resolveLabReference, formatDateTime };