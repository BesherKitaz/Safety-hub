import prisma from "../lib/prisma";
import { UserRole } from "@prisma/client";


const isUserRole = (role: UserRole) => async (userId: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      role: true,
    },
  }); 
  return user?.role === role;
}

const isUserAdmin = isUserRole(UserRole.ADMIN);
const isUserStaff = isUserRole(UserRole.STAFF)
const isUserSupervisor = isUserRole(UserRole.SUPERVISOR);
const isUserMentor = isUserRole(UserRole.MENTOR);
const isUserStudent = isUserRole(UserRole.STUDENT);


export { isUserAdmin, isUserMentor, isUserSupervisor, isUserStaff, isUserStudent };