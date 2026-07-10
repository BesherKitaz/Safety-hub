import { Router } from 'express';


import { 
  getUserDataById, 
  getUserProfileById, 
  getUserNameDatabyId,  
  createUser, 
  login, 
  userSearch, 
  getTabularUsers,
  getUserRoleById,
  getUserIdByEmail,
} from '../controllers/userController';

import { authMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth"
import prisma from '../lib/prisma';

const router = Router();


/* user routes */


// Get User Profile Route
router.get("/name", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
   try {
      const data = await getUserNameDatabyId(userId);
      res.json({
        message: "User profile",
        data
      });

    } catch (error) {
      res.status(500).json({
        error: `Error fetching user profile: ${error}`
      });
    }
});


  router.get("/profile/", authMiddleware, async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    try {
      const data = await getUserProfileById(userId)
      res.json({
        message: "User profile",
        data
      });

    } catch (error) {
      res.status(500).json({
        error: `Error fetching user profile: ${error}`
      });
    }
  });

  router.get("/profile/:id", authMiddleware, async (req: AuthRequest<{ id: string }>, res) => {
    const userId = req.params.id;
    try {
      const data = await getUserProfileById(userId)
      res.json({
        message: "User profile",
        data
      });

    } catch (error) {
      res.status(500).json({
        error: `Error fetching user profile: ${error}`
      });
    }
  });

  router.get("/tabular/total-rows", authMiddleware, async (req: AuthRequest, res) => {
    try { 
      const totalRows = await prisma.user.count()
        res.json({
            message: "Total rows fetched successfully",
            data: totalRows
        });
    } catch (error) {
      console.error("Error fetching total rows:", error);
      res.status(500).json({
        error: `Error fetching total rows: ${error}`
      });
    }
  })

    

  router.get("/tabular", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 10;

        const users = await getTabularUsers(page, pageSize);
        res.json({
            message: "Recent users fetched successfully",
            data: users
        });

    } catch (error) {
      console.error("Error fetching tabular users data:", error);
      res.status(500).json({
        error: `Error fetching tabular users data: ${error}`
      });
    }
  });

  
// Create User Route
router.post("/create", async (req, res) => {
  const userData = req.body;
  try {
    const user = await createUser(userData);
    res.json({
      message: "User created successfully",
      data: user,
      status: 201,
    });
  } catch (error) {
    res.status(500).json({
      error: `Error creating user: ${error}`
    });
  }
})


// Login Route
router.post("/login", async (req, res, next) => {

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required",
    });
  }
  try {
    const token = await login(email, password, next);
    const userId = await getUserIdByEmail(email);
    const userRole = await getUserRoleById(userId);
    res.json({
      message: "User logged in successfully",
      token: token,
      role: userRole,
      id: userId,
      status: 200,
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }
    res.status(500).json({
      error: `Error logging in user: ${error}`
    });
  }
})

router.get("/search", authMiddleware, async (req, res) => {
  const query = String(req.query.query ?? "").trim().toLocaleLowerCase();
  if (query.length < 2) {
    return res.json([]);
  }

  try {
    const users = await userSearch(query);
    res.json({
      message: "Users found",
      data: users,
    });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({
      message: `Error searching users: ${error}`
    });
  }
});



export default router;



