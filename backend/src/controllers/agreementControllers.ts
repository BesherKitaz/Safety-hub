import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

type AgreementLinkInput = {
  title: string;
  url: string;
  displayText: string | null;
};

const validateAgreementLink = (input: unknown): AgreementLinkInput => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new AppError(400, 'INVALID_AGREEMENT_LINK', 'Agreement link must be an object');
  }

  const { title, url, displayText } = input as Record<string, unknown>;
  const normalizedTitle = typeof title === 'string' ? title.trim() : '';
  const normalizedUrl = typeof url === 'string' ? url.trim() : '';
  if (!normalizedTitle) throw new AppError(400, 'AGREEMENT_LINK_TITLE_REQUIRED', 'A title is required');

  try {
    const parsedUrl = new URL(normalizedUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Unsupported protocol');
  } catch {
    throw new AppError(400, 'INVALID_AGREEMENT_LINK_URL', 'Enter a valid HTTP or HTTPS link');
  }

  if (displayText !== undefined && displayText !== null && typeof displayText !== 'string') {
    throw new AppError(400, 'INVALID_AGREEMENT_LINK_DISPLAY_TEXT', 'Display text must be a string');
  }

  return {
    title: normalizedTitle,
    url: normalizedUrl,
    displayText: typeof displayText === 'string' && displayText.trim() ? displayText.trim() : null,
  };
};

export const listAgreementLinks = () =>
  prisma.agreementLink.findMany({ orderBy: { createdAt: 'asc' } });

export const createAgreementLink = (input: unknown) =>
  prisma.agreementLink.create({ data: validateAgreementLink(input) });

export const updateAgreementLink = async (id: string, input: unknown) => {
  const existing = await prisma.agreementLink.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new AppError(404, 'AGREEMENT_LINK_NOT_FOUND', 'Agreement link not found');
  return prisma.agreementLink.update({ where: { id }, data: validateAgreementLink(input) });
};

export const deleteAgreementLink = async (id: string) => {
  const existing = await prisma.agreementLink.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new AppError(404, 'AGREEMENT_LINK_NOT_FOUND', 'Agreement link not found');
  await prisma.agreementLink.delete({ where: { id } });
};
