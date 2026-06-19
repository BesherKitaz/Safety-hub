const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
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

const UserRole = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  SUPERVISOR: "SUPERVISOR",
  MENTOR: "MENTOR",
  STUDENT: "STUDENT",
};

const TrainingNodeType = {
  GENERAL: "GENERAL",
  LAB: "LAB",
  TOOL: "TOOL",
};

const CertificationStatus = {
  ACTIVE: "ACTIVE",
};

const seedPassword = "password123";
const DAY_MS = 24 * 60 * 60 * 1000;
const baseIssuedAt = new Date(Date.UTC(2026, 5, 17, 15, 0, 0));

const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);
const makeIssuedAt = (index) => new Date(baseIssuedAt.getTime() - index * 2 * DAY_MS);

const users = [
  {
    email: "admin@purdue.edu",
    firstName: "Besher",
    lastName: "Kitaz",
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
  {
    email: "student.sophia@purdue.edu",
    firstName: "Sophia",
    lastName: "Martinez",
    role: UserRole.STUDENT,
  },
];

const labs = [
  {
    name: "Chemistry Lab",
    description: "Wet chemistry benches, reagent storage, and fume hood procedures.",
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
    description: "Microscopy, sample preparation, and routine biological handling.",
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
    description: "Low-voltage prototyping, soldering, and circuit testing workflows.",
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
    description: "Metalworking, cutting, drilling, and general fabrication safety.",
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

async function main() {
  const passwordHash = await bcrypt.hash(seedPassword, 12);

  await prisma.trainingEdge.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.trainingNode.deleteMany();
  await prisma.tool.deleteMany();
  await prisma.lab.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: users.map((user) => ({
      ...user,
      passwordHash,
    })),
  });

  await prisma.lab.createMany({
    data: labs.map((lab) => ({
      name: lab.name,
      description: lab.description,
    })),
  });

  const seededUsers = await prisma.user.findMany();
  const seededLabs = await prisma.lab.findMany();

  const userByEmail = new Map(seededUsers.map((user) => [user.email, user]));
  const labByName = new Map(seededLabs.map((lab) => [lab.name, lab]));

  const toolBlueprints = labs.flatMap((lab) =>
    lab.tools.map((tool) => ({
      ...tool,
      labName: lab.name,
    })),
  );

  await prisma.tool.createMany({
    data: toolBlueprints.map((tool) => {
      const labRecord = labByName.get(tool.labName);

      if (!labRecord) {
        throw new Error(`Missing seed reference for lab ${tool.labName}`);
      }

      return {
        name: tool.name,
        description: tool.description,
        labId: labRecord.id,
      };
    }),
  });

  const seededTools = await prisma.tool.findMany();
  const toolByName = new Map(seededTools.map((tool) => [tool.name, tool]));

  const generalNodes = [];
  const labNodes = [];

  for (const lab of labs) {
    const labRecord = labByName.get(lab.name);

    if (!labRecord) {
      throw new Error(`Missing seed reference for lab ${lab.name}`);
    }

    const generalNode = await prisma.trainingNode.create({
      data: {
        name: `${lab.name} General Safety Training`,
        type: TrainingNodeType.GENERAL,
        labId: labRecord.id,
      },
    });

    generalNodes.push(generalNode);

    const labNode = await prisma.trainingNode.create({
      data: {
        name: lab.name,
        type: TrainingNodeType.LAB,
        labId: labRecord.id,
      },
    });

    labNodes.push(labNode);

    await prisma.trainingEdge.create({
      data: {
        parentId: generalNode.id,
        childId: labNode.id,
      },
    });
  }

  const labNodeByName = new Map(labNodes.map((node) => [node.name, node]));
  const toolNodes = [];

  for (const lab of labs) {
    const labNode = labNodeByName.get(lab.name);

    if (!labNode) {
      throw new Error(`Missing seed reference for lab node ${lab.name}`);
    }

    for (const tool of lab.tools) {
      const toolRecord = toolByName.get(tool.name);

      if (!toolRecord) {
        throw new Error(`Missing seed reference for tool ${tool.name}`);
      }

      const toolNode = await prisma.trainingNode.create({
        data: {
          name: tool.name,
          type: TrainingNodeType.TOOL,
          labId: labNode.labId,
          toolId: toolRecord.id,
        },
      });

      toolNodes.push({
        ...toolNode,
        labName: lab.name,
        toolName: tool.name,
      });

      await prisma.trainingEdge.create({
        data: {
          parentId: labNode.id,
          childId: toolNode.id,
        },
      });
    }
  }

  const studentUsers = users.filter((user) => user.role === UserRole.STUDENT);
  const issuerEmails = users
    .filter((user) => user.role !== UserRole.STUDENT)
    .map((user) => user.email);

  const certificationData = [];
  let certificationIndex = 0;

  for (const [studentIndex, student] of studentUsers.entries()) {
    const studentRecord = userByEmail.get(student.email);

    if (!studentRecord) {
      throw new Error(`Missing seed reference for student ${student.email}`);
    }

    for (const [nodeIndex, node] of toolNodes.entries()) {
      const issuerEmail = issuerEmails[(studentIndex + nodeIndex) % issuerEmails.length];
      const issuerRecord = userByEmail.get(issuerEmail);

      if (!issuerRecord) {
        throw new Error(`Missing seed reference for issuer ${issuerEmail}`);
      }

      const issuedAt = makeIssuedAt(certificationIndex);

      certificationData.push({
        issuedToId: studentRecord.id,
        issuedById: issuerRecord.id,
        trainingNodeId: node.id,
        level: 1,
        notes: `${student.firstName} completed ${node.labName.toLowerCase()} training for ${node.toolName}.`,
        status: CertificationStatus.ACTIVE,
        issuedAt,
        expiryDate: addDays(issuedAt, 365),
      });

      certificationIndex += 1;
    }
  }

  await prisma.certification.createMany({
    data: certificationData,
  });

  console.log("Seed complete.");
  console.log("Admin login: admin@purdue.edu / password123");
  console.log(
    `Seeded ${users.length} users, ${labs.length} labs, ${toolBlueprints.length} tools, ${
      generalNodes.length + labNodes.length + toolNodes.length
    } training nodes, ${generalNodes.length + labNodes.length} training edges, and ${
      certificationData.length
    } certifications.`,
  );
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