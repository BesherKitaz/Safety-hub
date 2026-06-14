const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const { PrismaClient, CertificationLevel, UserRole } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

dotenv.config({
  path: path.resolve(process.cwd(), "../.env"),
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined. Make sure ../.env is available.");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const seedPassword = "Test1234!";

const users = [
  {
    email: "admin@safetyhub.test",
    firstName: "Avery",
    lastName: "Admin",
    role: UserRole.ADMIN,
  },
  {
    email: "mentor.jordan@safetyhub.test",
    firstName: "Jordan",
    lastName: "Lee",
    role: UserRole.MENTOR,
  },
  {
    email: "mentor.mia@safetyhub.test",
    firstName: "Mia",
    lastName: "Patel",
    role: UserRole.MENTOR,
  },
  {
    email: "student.noah@safetyhub.test",
    firstName: "Noah",
    lastName: "Kim",
    role: UserRole.STUDENT,
  },
  {
    email: "student.ava@safetyhub.test",
    firstName: "Ava",
    lastName: "Martinez",
    role: UserRole.STUDENT,
  },
  {
    email: "student.ellie@safetyhub.test",
    firstName: "Ellie",
    lastName: "Johnson",
    role: UserRole.STUDENT,
  },
  {
    email: "student.marcus@safetyhub.test",
    firstName: "Marcus",
    lastName: "Brown",
    role: UserRole.STUDENT,
  },
  {
    email: "student.priya@safetyhub.test",
    firstName: "Priya",
    lastName: "Singh",
    role: UserRole.STUDENT,
  },
];

const categories = [
  {
    name: "Lab Safety",
    description: "Core safety expectations for lab and workshop environments.",
  },
  {
    name: "Emergency Response",
    description: "Fire, evacuation, first aid, and incident escalation basics.",
  },
  {
    name: "Equipment Handling",
    description: "Safe use, inspection, and storage procedures for equipment.",
  },
  {
    name: "Reporting & Compliance",
    description: "How to document incidents and meet safety policy requirements.",
  },
];

const currentMonth = new Date();
const lastMonth = new Date();
lastMonth.setMonth(lastMonth.getMonth() - 1);

const certifications = [
  {
    issuedToEmail: "student.noah@safetyhub.test",
    issuedByEmail: "mentor.jordan@safetyhub.test",
    categoryName: "Lab Safety",
    level: CertificationLevel.LEVEL_1,
    issuedAt: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 3, 10, 0, 0),
    notes: "Completed the lab safety onboarding checklist.",
  },
  {
    issuedToEmail: "student.ava@safetyhub.test",
    issuedByEmail: "mentor.jordan@safetyhub.test",
    categoryName: "Emergency Response",
    level: CertificationLevel.LEVEL_2,
    issuedAt: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 7, 11, 30, 0),
    notes: "Reviewed evacuation routes and alarm procedures.",
  },
  {
    issuedToEmail: "student.ellie@safetyhub.test",
    issuedByEmail: "mentor.mia@safetyhub.test",
    categoryName: "Equipment Handling",
    level: CertificationLevel.LEVEL_1,
    issuedAt: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 12, 9, 15, 0),
    notes: "Passed the equipment handling refresher.",
  },
  {
    issuedToEmail: "student.marcus@safetyhub.test",
    issuedByEmail: "mentor.mia@safetyhub.test",
    categoryName: "Reporting & Compliance",
    level: CertificationLevel.LEVEL_3,
    issuedAt: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 15, 14, 45, 0),
    notes: "Completed reporting workflow review.",
  },
  {
    issuedToEmail: "student.priya@safetyhub.test",
    issuedByEmail: "admin@safetyhub.test",
    categoryName: "Lab Safety",
    level: CertificationLevel.LEVEL_2,
    issuedAt: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 18, 13, 20, 0),
    notes: "Demonstrated hazard identification in a practical session.",
  },
  {
    issuedToEmail: "student.noah@safetyhub.test",
    issuedByEmail: "mentor.mia@safetyhub.test",
    categoryName: "Reporting & Compliance",
    level: CertificationLevel.LEVEL_2,
    issuedAt: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 9, 10, 0, 0),
    notes: "Completed last month's compliance review.",
  },
  {
    issuedToEmail: "student.ava@safetyhub.test",
    issuedByEmail: "admin@safetyhub.test",
    categoryName: "Equipment Handling",
    level: CertificationLevel.LEVEL_3,
    issuedAt: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 14, 16, 10, 0),
    notes: "Completed advanced handling review.",
  },
  {
    issuedToEmail: "student.ellie@safetyhub.test",
    issuedByEmail: "mentor.jordan@safetyhub.test",
    categoryName: "Emergency Response",
    level: CertificationLevel.LEVEL_1,
    issuedAt: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 20, 12, 0, 0),
    notes: "Refresh of emergency contacts and procedures.",
  },
  {
    issuedToEmail: "student.priya@safetyhub.test",
    issuedByEmail: "mentor.mia@safetyhub.test",
    categoryName: "Reporting & Compliance",
    level: CertificationLevel.LEVEL_4,
    issuedAt: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 24, 9, 30, 0),
    notes: "Advanced compliance review and documentation audit.",
  },
  {
    issuedToEmail: "student.marcus@safetyhub.test",
    issuedByEmail: "admin@safetyhub.test",
    categoryName: "Lab Safety",
    level: CertificationLevel.LEVEL_2,
    issuedAt: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 21, 15, 0, 0),
    notes: "Completed a supervised lab safety recheck.",
  },
  {
    issuedToEmail: "student.noah@safetyhub.test",
    issuedByEmail: "mentor.mia@safetyhub.test",
    categoryName: "Emergency Response",
    level: CertificationLevel.LEVEL_3,
    issuedAt: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 22, 9, 45, 0),
    notes: "Completed scenario-based emergency response review.",
  },
  {
    issuedToEmail: "student.ava@safetyhub.test",
    issuedByEmail: "mentor.jordan@safetyhub.test",
    categoryName: "Reporting & Compliance",
    level: CertificationLevel.LEVEL_1,
    issuedAt: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 27, 10, 20, 0),
    notes: "Reviewed the incident reporting checklist.",
  },
  {
    issuedToEmail: "student.ellie@safetyhub.test",
    issuedByEmail: "mentor.mia@safetyhub.test",
    categoryName: "Lab Safety",
    level: CertificationLevel.LEVEL_3,
    issuedAt: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 23, 11, 10, 0),
    notes: "Completed advanced lab safety guidance.",
  },
  {
    issuedToEmail: "student.priya@safetyhub.test",
    issuedByEmail: "admin@safetyhub.test",
    categoryName: "Equipment Handling",
    level: CertificationLevel.LEVEL_2,
    issuedAt: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 24, 13, 5, 0),
    notes: "Demonstrated proper equipment handling procedures.",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(seedPassword, 12);

  const seededUsers = await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          passwordHash,
        },
        create: {
          ...user,
          passwordHash,
        },
      }),
    ),
  );

  const seededCategories = await Promise.all(
    categories.map((category) =>
      prisma.category.upsert({
        where: { name: category.name },
        update: {
          description: category.description,
        },
        create: category,
      }),
    ),
  );

  const userByEmail = new Map(seededUsers.map((user) => [user.email, user]));
  const categoryByName = new Map(
    seededCategories.map((category) => [category.name, category]),
  );

  await Promise.all(
    certifications.map((certification) => {
      const issuedTo = userByEmail.get(certification.issuedToEmail);
      const issuedBy = userByEmail.get(certification.issuedByEmail);
      const category = categoryByName.get(certification.categoryName);

      if (!issuedTo || !issuedBy || !category) {
        throw new Error(`Missing seed reference for ${certification.categoryName}`);
      }

      return prisma.certification.upsert({
        where: {
          issuedToId_categoryId_level: {
            issuedToId: issuedTo.id,
            categoryId: category.id,
            level: certification.level,
          },
        },
        update: {
          issuedById: issuedBy.id,
          issuedAt: certification.issuedAt,
          notes: certification.notes,
        },
        create: {
          issuedToId: issuedTo.id,
          issuedById: issuedBy.id,
          categoryId: category.id,
          level: certification.level,
          issuedAt: certification.issuedAt,
          notes: certification.notes,
        },
      });
    }),
  );

  console.log("Seed complete.");
  console.log("Test login password for all seeded accounts:", seedPassword);
  console.log("Seeded users:");
  users.forEach((user) => {
    console.log(`- ${user.email} (${user.role})`);
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
