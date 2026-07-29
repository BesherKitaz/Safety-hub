// middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
import prisma from "../lib/prisma";

const prismaAny = prisma as any;

type AuthTokenPayload = {
  userId: string;
  email: string;
  role: string;
};

export type AuthRequest<P = Record<string, string>> = Request<P> & {
  user?: AuthTokenPayload;
};

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError(401, 'TOKEN_REQUIRED', 'No token provided'));
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return next(new AppError(401, 'TOKEN_REQUIRED', 'No token provided'));
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as AuthTokenPayload;

    const user = await prismaAny.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || user.isActive === false) {
      return next(new AppError(401, 'ACCOUNT_UNAVAILABLE', 'This account is unavailable'));
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch {
    return next(new AppError(401, 'TOKEN_INVALID', 'Invalid or expired token'));
  }
};

