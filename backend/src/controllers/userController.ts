
// import database client
import  prisma from '../lib/prisma';



const getUserDataById = async (id: string) => {
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


export { getUserDataById };