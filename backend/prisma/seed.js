const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const { PrismaClient, UserRole } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined. Make sure ../../.env is available.");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const seedPassword = "password123";

const users = [
  {
    email: "admin@purdue.edu",
    firstName: "Avery",
    lastName: "Purdue",
    role: UserRole.ADMIN,
  },
  {
    email: "staff.sarah@purdue.edu",
    firstName: "Sarah",
    lastName: "Nguyen",
    role: UserRole.STAFF,
  },
  {
    email: "supervisor.owen@purdue.edu",
    firstName: "Owen",
    lastName: "Price",
    role: UserRole.SUPERVISOR,
  },
  {
    email: "mentor.priya@purdue.edu",
    firstName: "Priya",
    lastName: "Singh",
    role: UserRole.MENTOR,
  },
  {
    email: "mentor.liam@purdue.edu",
    firstName: "Liam",
    lastName: "Patel",
    role: UserRole.MENTOR,
  },
  {
    email: "student.noah@purdue.edu",
    firstName: "Noah",
    lastName: "Kim",
    role: UserRole.STUDENT,
  },
  {
    email: "student.ava@purdue.edu",
    firstName: "Ava",
    lastName: "Johnson",
    role: UserRole.STUDENT,
  },
  {
    email: "student.ellie@purdue.edu",
    firstName: "Ellie",
    lastName: "Brown",
    role: UserRole.STUDENT,
  },
  {
    email: "student.marcus@purdue.edu",
    firstName: "Marcus",
    lastName: "Lee",
    role: UserRole.STUDENT,
  },
];

const labs = [
  {
    name: "Chemistry Lab",
    description:
      "Wet chemistry benches, reagent storage, and fume hood procedures.",
    tools: [
      {
        name: "Fume Hood",
        description: "Ventilated enclosure for volatile chemicals.",
      },
      {
        name: "Analytical Balance",
        description: "Precision scale for measuring small sample masses.",
      },
      {
        name: "Centrifuge",
        description: "Separates samples at high speed for analysis.",
      },
    ],
  },
  {
    name: "Biology Lab",
    description:
      "Microscopy, sample preparation, and routine biological handling.",
    tools: [
      {
        name: "Microscope",
        description: "High-magnification inspection for specimens and slides.",
      },
      {
        name: "Autoclave",
        description: "Sterilizes lab equipment and materials with steam.",
      },
      {
        name: "Incubator",
        description: "Maintains controlled temperature for cultures.",
      },
    ],
  },
  {
    name: "Electronics Lab",
    description:
      "Low-voltage prototyping, soldering, and circuit testing workflows.",
    tools: [
      {
        name: "Soldering Station",
        description: "Temperature-controlled station for PCB assembly.",
      },
      {
        name: "Oscilloscope",
        description: "Visualizes voltage changes across electronic circuits.",
      },
      {
        name: "Bench Power Supply",
        description: "Provides stable power for bench-top electronics work.",
      },
    ],
  },
  {
    name: "Machine Shop",
    description:
      "Metalworking, cutting, drilling, and general fabrication safety.",
    tools: [
      {
        name: "Drill Press",
        description: "Fixed drilling tool for precise vertical holes.",
      },
      {
        name: "Bandsaw",
        description: "Cuts stock material with a continuous blade.",
      },
      {
        name: "Lathe",
        description: "Shapes rotating stock for turning operations.",
      },
    ],
  },
];

const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();
const makeDate = (monthOffset, day, hour, minute) =>
  new Date(currentYear, currentMonth + monthOffset, day, hour, minute, 0, 0);

const certifications = [
  {
    issuedToEmail: "student.noah@purdue.edu",
    issuedByEmail: "mentor.priya@purdue.edu",
    labName: "Chemistry Lab",
    issuedAt: makeDate(0, 3, 9, 0),
    notes: "Completed wet chemistry onboarding and PPE review.",
  },
  {
    issuedToEmail: "student.ava@purdue.edu",
    issuedByEmail: "mentor.liam@purdue.edu",
    labName: "Biology Lab",
    issuedAt: makeDate(0, 6, 10, 30),
    notes: "Reviewed sterile handling and microscopy procedures.",
  },
  {
    issuedToEmail: "student.ellie@purdue.edu",
    issuedByEmail: "admin@purdue.edu",
    labName: "Electronics Lab",
    issuedAt: makeDate(0, 10, 13, 15),
    notes: "Passed the circuit bench safety check.",
  },
  {
    issuedToEmail: "student.marcus@purdue.edu",
    issuedByEmail: "supervisor.owen@purdue.edu",
    labName: "Machine Shop",
    issuedAt: makeDate(-1, 12, 11, 45),
    notes: "Completed supervised machining orientation.",
  },
  {
    issuedToEmail: "student.noah@purdue.edu",
    issuedByEmail: "mentor.liam@purdue.edu",
    labName: "Biology Lab",
    issuedAt: makeDate(-1, 18, 9, 20),
    notes: "Demonstrated safe sample handling and disposal.",
  },
  {
    issuedToEmail: "student.ava@purdue.edu",
    issuedByEmail: "mentor.priya@purdue.edu",
    labName: "Machine Shop",
    issuedAt: makeDate(0, 20, 14, 5),
    notes: "Completed machine shop tool identification review.",
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

  const seededLabs = await Promise.all(
    labs.map((lab) =>
      prisma.lab.upsert({
        where: { name: lab.name },
        update: {
          description: lab.description,
        },
        create: {
          name: lab.name,
          description: lab.description,
        },
      }),
    ),
  );

  const userByEmail = new Map(seededUsers.map((user) => [user.email, user]));
  const labByName = new Map(seededLabs.map((lab) => [lab.name, lab]));

  const tools = labs.flatMap((lab) =>
    lab.tools.map((tool) => ({
      ...tool,
      labName: lab.name,
    })),
  );

  await Promise.all(
    tools.map((tool) => {
      const lab = labByName.get(tool.labName);

      if (!lab) {
        throw new Error(`Missing seed reference for ${tool.labName}`);
      }

      return prisma.tool.upsert({
        where: { name: tool.name },
        update: {
          description: tool.description,
          labId: lab.id,
        },
        create: {
          name: tool.name,
          description: tool.description,
          labId: lab.id,
        },
      });
    }),
  );

  await Promise.all(
    certifications.map((certification) => {
      const issuedTo = userByEmail.get(certification.issuedToEmail);
      const issuedBy = userByEmail.get(certification.issuedByEmail);
      const lab = labByName.get(certification.labName);

      if (!issuedTo || !issuedBy || !lab) {
        throw new Error(`Missing seed reference for ${certification.labName}`);
      }

      return prisma.certification.upsert({
        where: {
          issuedToId_labId: {
            issuedToId: issuedTo.id,
            labId: lab.id,
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
          labId: lab.id,
          issuedAt: certification.issuedAt,
          notes: certification.notes,
        },
      });
    }),
  );

  console.log("Seed complete.");
  console.log("Admin login: admin@purdue.edu / password123");
  console.log("Seeded users:");
  users.forEach((user) => {
    console.log(`- ${user.email} (${user.role})`);
  });
  console.log("Seeded labs:");
  labs.forEach((lab) => {
    console.log(`- ${lab.name}`);
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
