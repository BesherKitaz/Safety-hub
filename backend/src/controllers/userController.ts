
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
    console.log("Fetched id:", id);
    try {
    // fetch from db
        const userData = await prisma.user.findUnique({
        where: {
            id: id
        }
        });
        console.log("Fetched user data:", userData);

    return userData;
    } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
    }

};


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
        throw new Error("User not found");
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        throw new Error("Invalid password");
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
                { expiresIn: "1h" }
            );
        } catch (err) {
            console.log(err);
            const error =
                new Error("Error! Something went wrong.");
            return next(error);
        }


    return token;
};
export { getUserDataById, createUser, login };


