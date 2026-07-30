import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const normalizeName = (value: unknown, label: string) => {
  const name = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  if (!name) throw new AppError(400, `${label.toUpperCase()}_NAME_REQUIRED`, `${label} name is required.`);
  return name;
};

// Public signup/profile options include only active colleges and departments.
export const listAcademicOptions = () =>
  prisma.college.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      departments: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, collegeId: true },
      },
    },
  });

// Admin management includes inactive entries so they can be restored.
export const listAcademicManagement = () =>
  prisma.college.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      isActive: true,
      departments: {
        orderBy: { name: 'asc' },
        select: { id: true, name: true, collegeId: true, isActive: true },
      },
    },
  });

export const createCollege = (nameValue: unknown) =>
  prisma.college.create({ data: { name: normalizeName(nameValue, 'College') } });

export const updateCollege = (id: string, input: { name?: unknown; isActive?: unknown }) =>
  prisma.college.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: normalizeName(input.name, 'College') } : {}),
      ...(typeof input.isActive === 'boolean' ? { isActive: input.isActive } : {}),
    },
  });

export const createDepartment = async (collegeId: string, nameValue: unknown) => {
  const college = await prisma.college.findUnique({ where: { id: collegeId }, select: { id: true } });
  if (!college) throw new AppError(404, 'COLLEGE_NOT_FOUND', 'College not found.');
  return prisma.department.create({
    data: { collegeId, name: normalizeName(nameValue, 'Department') },
  });
};

export const updateDepartment = (id: string, input: { name?: unknown; isActive?: unknown }) =>
  prisma.department.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: normalizeName(input.name, 'Department') } : {}),
      ...(typeof input.isActive === 'boolean' ? { isActive: input.isActive } : {}),
    },
  });

// Aggregate affiliation counts for the academic directory dashboard.
export const getAcademicStats = async () => {
  const [totalUsers, colleges, departments, affiliations] = await Promise.all([
    prisma.user.count(),
    prisma.college.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.department.findMany({
      orderBy: [{ college: { name: 'asc' } }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        college: { select: { id: true, name: true } },
        _count: { select: { affiliations: true } },
      },
    }),
    prisma.userAcademicAffiliation.findMany({
      select: { userId: true, collegeId: true },
    }),
  ]);

  const totalAffiliations = departments.reduce((sum, item) => sum + item._count.affiliations, 0);
  const affiliatedUsers = await prisma.user.count({ where: { academicAffiliations: { some: {} } } });
  const usersByCollege = new Map<string, Set<string>>();
  affiliations.forEach((affiliation) => {
    const users = usersByCollege.get(affiliation.collegeId) ?? new Set<string>();
    users.add(affiliation.userId);
    usersByCollege.set(affiliation.collegeId, users);
  });
  const totalCollegeAffiliations = [...usersByCollege.values()].reduce((sum, users) => sum + users.size, 0);

  return {
    totalUsers,
    affiliatedUsers,
    totalAffiliations,
    totalCollegeAffiliations,
    colleges: colleges.map((item) => ({ id: item.id, name: item.name, count: usersByCollege.get(item.id)?.size ?? 0 })),
    departments: departments.map((item) => ({
      id: item.id,
      name: item.name,
      collegeId: item.college.id,
      collegeName: item.college.name,
      count: item._count.affiliations,
    })),
  };
};
