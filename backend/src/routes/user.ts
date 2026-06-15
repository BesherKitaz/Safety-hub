import { Router } from 'express';


import { getUserDataById, getUserNameDatabyId,  createUser, login, userSearch } from '../controllers/userController';
import { authMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth"


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
  res.json();
});


  router.get("/profile/", authMiddleware, async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    try {
      const data = await getUserDataById(userId);
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
    res.json({
      message: "User logged in successfully",
      token: token,
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

