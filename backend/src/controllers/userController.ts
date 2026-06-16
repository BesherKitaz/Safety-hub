
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

const getUserNameDatabyId = async (id: string) => {
    console.log("Fetched id:", id);
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
export { getUserDataById, getUserNameDatabyId, createUser, login, userSearch };


