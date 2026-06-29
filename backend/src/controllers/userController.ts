
// import database client
import  prisma from '../lib/prisma';
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'


type User = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

type CertificationsByLab = {
    labId: string;
    labName: string;
    certifications: {}[];
};


dotenv.config({
    path: '../.env'
});


const getUserDataById = async (id: string) => {
    try {
    // fetch from db
        const userData = await prisma.user.findUnique({
        where: {
            id: id
        },
        select: {
            firstName: true,
            lastName: true,
            userAgreementSource: true,
            isUserAgreementComplete: true,
            email: true,
            role: true,
            id: true
        }
        });

    return userData;
    } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
    }
};

const getUserProfileById = async (id: string) => {
    try {
        const userData = await prisma.user.findUnique({
            where: {
                id: id
            },
            select: {
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                id: true,
                createdAt: true,
                userAgreementSource: true,
                isUserAgreementComplete: true
            }
        });

        const certifications = await prisma.certification.findMany({
            where: {
                issuedToId: id
            },
            include: {
                issuedBy: {
                    select:{
                        id: true,
                        firstName: true,
                        lastName: true
                    } 
                },
                trainingNode: {
                include: {
                    lab: {
                        select: {
                            id: true,
                            name: true,
                        }
                    },
                },
                },
            },
            orderBy: {
                issuedAt: "desc",
            },
        });
        console.log("CERTS",certifications)


        const certsGroupedByLab = certifications.reduce<CertificationsByLab[]>(
            (acc, cert) => {
                const lab = cert.trainingNode.lab;

                let existingLabGroup = acc.find(
                    (group) => group.labId === lab.id
                );

                if (!existingLabGroup) {
                    existingLabGroup = {
                        labId: lab.id,
                        labName: lab.name,
                        certifications: [],
                    };

                    acc.push(existingLabGroup);
                }

                existingLabGroup.certifications.push(cert);

                return acc;
            },
            []
        );
            
            
        const userProfileData = {
            ...userData,
            certsGroupedByLab
        }
        return userProfileData
        
    } catch (error) {
        console.error("Error fetching user profile data:", error);
        throw error;
    }
}

const getTabularUsers = async (page: number, pageSize: number) => {
    try {
        const skip = (page - 1) * pageSize;
        const certifications = await prisma.user.findMany({
            skip,
            take: pageSize,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isUserAgreementComplete: true,
                userAgreementSource: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            }
        })
        return certifications;
    } catch (error) {
        console.error("Error fetching tabular users:", error);
        throw error;
    }
}


const getUserNameDatabyId = async (id: string) => {
    try {
    // fetch from db
    const userData = await prisma.user.findUnique({
        where: {
            id: id
        },
        select: {
            firstName: true,
            lastName: true
        },
    });
    return userData;
    } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
    }
};

const userSearch = async (query: string) => {
    console.log("Search query:", query);
    const users = await prisma.user.findMany({
    where: {
      role: { in: ["STUDENT", "MENTOR", "SUPERVISOR"] },
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
    take: 10,
  });

  return users;
}

const createUser = async (userData: User) => {

    const checkUserExists = await prisma.user.findUnique({
        where: {
            email: userData.email
        }
    });
    if (checkUserExists) {
        throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

 
    try {
        const user = await prisma.user.create({
            data: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                passwordHash: hashedPassword
            }
        });
        console.log("Created user:", user);
        return user;
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
};

const login = async (email: string, password: string, next: (error?: Error) => void) => {
    const user = await prisma.user.findUnique({
        where: {
            email: email
        }
    });
    if (!user) {
        throw new Error("INVALID_CREDENTIALS");
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        throw new Error("INVALID_CREDENTIALS");    
    }   

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }

        let token: string;
        try {
            //Creating jwt token
            token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email
                },
                JWT_SECRET,
                { expiresIn: "7d" }
            );
        } catch (err) {
            console.log(err);
            const error =
                new Error("Error! Something went wrong.");
            return next(error);
        }

    return token;
};
export { getUserDataById, getUserProfileById, getUserNameDatabyId, createUser, login, userSearch, getTabularUsers };


