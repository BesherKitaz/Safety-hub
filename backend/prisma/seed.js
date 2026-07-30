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

const academicDirectory = [
  {
    name: "College of Engineering",
    departments: ["Mechanical Engineering", "Electrical and Computer Engineering", "Industrial Engineering"],
  },
  {
    name: "College of Science",
    departments: ["Computer Science", "Mathematics", "Physics and Astronomy"],
  },
  {
    name: "Purdue Polytechnic Institute",
    departments: ["Computer and Information Technology", "Engineering Technology"],
  },
];

const labs = [
  {
    name: "Woodshop",
    description: "Cutting, shaping, sanding, and safe use of common woodworking equipment.",
    tools: [
      {
        name: "Table Saw",
        description: "Primary cutting station for ripping and crosscutting lumber.",
      },
      {
        name: "Router Table",
        description: "Stationary routing setup for edges, grooves, and profiles.",
      },
      {
        name: "Drum Sander",
        description: "Finishing machine for smoothing and leveling wood surfaces.",
      },
    ],
  },
  {
    name: "Metal Shop",
    description: "Cutting, welding, drilling, and layout workflows for metal fabrication.",
    tools: [
      {
        name: "MIG Welder",
        description: "Wire-feed welding station for joining steel and aluminum.",
      },
      {
        name: "Sheet Metal Brake",
        description: "Bending tool for forming precise metal angles and flanges.",
      },
      {
        name: "Metal Bandsaw",
        description: "Cutoff saw for stock, tubing, and bar material.",
      },
    ],
  },
  {
    name: "Fabrics",
    description: "Sewing, cutting, pressing, and finishing textile and apparel projects.",
    tools: [
      {
        name: "Sewing Machine",
        description: "Primary machine for stitching garments, repairs, and prototypes.",
      },
      {
        name: "Serger",
        description: "Overlock machine for clean seams and edge finishing.",
      },
      {
        name: "Heat Press",
        description: "Applies heat and pressure for transfers, patches, and embellishments.",
      },
      {
        name: "Fabric Cutter",
        description: "Precision cutting tool for textiles, patterns, and trim pieces.",
      },
    ],
  },
  {
    name: "Blacksmithing",
    description: "Forging, heating, shaping, and striking hot metal safely.",
    tools: [
      {
        name: "Forge",
        description: "Heat source used to bring metal to forging temperature.",
      },
      {
        name: "Anvil",
        description: "Primary forming surface for hammering and shaping metal.",
      },
      {
        name: "Power Hammer",
        description: "Mechanical hammer for heavy forging and rapid stock reduction.",
      },
      {
        name: "Quench Tank",
        description: "Cooling station for hardening and heat treatment workflows.",
      },
    ],
  },
  {
    name: "Advnaced Machines Lab",
    description: "CNC machining, precision fabrication, and automated equipment workflows.",
    tools: [
      {
        name: "CNC Mill",
        description: "Computer-controlled mill for precise subtractive machining.",
      },
      {
        name: "CNC Lathe",
        description: "Automated turning machine for cylindrical parts and shafts.",
      },
      {
        name: "Waterjet Cutter",
        description: "High-pressure cutting system for metal, stone, and composite materials.",
      },
      {
        name: "Surface Grinder",
        description: "Finishing machine for flat, accurate, and highly smooth surfaces.",
      },
    ],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(seedPassword, 12);

  await prisma.trainingEdge.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.userAcademicAffiliation.deleteMany();
  await prisma.trainingNode.deleteMany();
  await prisma.tool.deleteMany();
  await prisma.lab.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.college.deleteMany();

  await prisma.user.createMany({
    data: users.map((user) => ({
      ...user,
      passwordHash,
    })),
  });

  for (const college of academicDirectory) {
    await prisma.college.create({
      data: {
        name: college.name,
        departments: {
          create: college.departments.map((name) => ({ name })),
        },
      },
    });
  }

  await prisma.lab.createMany({
    data: labs.map((lab) => ({
      name: lab.name,
      description: lab.description,
    })),
  });

  const seededUsers = await prisma.user.findMany();
  const seededDepartments = await prisma.department.findMany();
  const seededLabs = await prisma.lab.findMany();

  const userByEmail = new Map(seededUsers.map((user) => [user.email, user]));
  const departmentByName = new Map(seededDepartments.map((department) => [department.name, department]));
  const labByName = new Map(seededLabs.map((lab) => [lab.name, lab]));

  const seedDepartmentNames = [
    "Mechanical Engineering",
    "Electrical and Computer Engineering",
    "Industrial Engineering",
    "Computer Science",
    "Mathematics",
    "Physics and Astronomy",
    "Computer and Information Technology",
    "Engineering Technology",
  ];
  for (let index = 0; index < seededUsers.length; index += 1) {
    const department = departmentByName.get(seedDepartmentNames[index % seedDepartmentNames.length]);
    if (!department) continue;
    await prisma.userAcademicAffiliation.create({
      data: {
        userId: seededUsers[index].id,
        collegeId: department.collegeId,
        departmentId: department.id,
      },
    });
  }

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

    generalNodes.push({
      ...generalNode,
      labName: lab.name,
    });
  }

  const generalNodeByLabName = new Map(
    generalNodes.map((node) => [node.labName, node]),
  );
  const toolNodes = [];

  for (const lab of labs) {
    const generalNode = generalNodeByLabName.get(lab.name);

    if (!generalNode) {
      throw new Error(`Missing seed reference for general training node in ${lab.name}`);
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
          labId: generalNode.labId,
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
          parentId: generalNode.id,
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
      generalNodes.length + toolNodes.length
    } training nodes, ${toolNodes.length} training edges, and ${
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
