import { Router } from 'express';
import { sendEmail } from "../services/emailService";


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
  checkPasswordStrength,
  validateSignupData,
  AppError,
} from '../controllers/userControllers';

import { authMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth"
import prisma from '../lib/prisma';
import { sendError } from '../middleware/errorHandler';

const router = Router();

/* Email-related routes */
router.post("/test-email", async (req, res, next) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || email.trim() === "") {
      return res.status(400).json({
        error: {
          code: "EMAIL_REQUIRED",
          message: "Email is required",
        },
      });
    }
    
    const result = await sendEmail({
      to: email.trim(),
      subject: "SafetyHub test email",
      text: "Your SafetyHub email service is working.",
      html: `
        <h2>SafetyHub</h2>
        <p>Your email service is working.</p>
      `,
    });

    return res.json({
      message: "Test email created",
      data: result,
    }); 
  } catch (error) {
    console.error("Error sending test email:", error);
    return sendError(res, error, {
      statusCode: 500,
      code: 'EMAIL_TEST_FAILED',
      message: 'Error sending test email',
    });
  }
});

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
      return sendError(res, error, {
        statusCode: 500,
        code: 'USER_FETCH_FAILED',
        message: 'Error fetching user profile',
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
      return sendError(res, error, {
        statusCode: 500,
        code: 'USER_FETCH_FAILED',
        message: 'Error fetching user profile',
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
      return sendError(res, error, {
        statusCode: 500,
        code: 'USER_FETCH_FAILED',
        message: 'Error fetching user profile',
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
      return sendError(res, error, {
        statusCode: 500,
        code: 'USER_COUNT_FAILED',
        message: 'Error fetching total rows',
      });
    }
  })

    
  // Get Users for the table of users page
  router.get("/tabular", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 10;
        const search = String(req.query.search ?? "").trim().toLocaleLowerCase();
        const users = await getTabularUsers(page, pageSize, { search });
        res.json({
            message: "Recent users fetched successfully",
            data: users
        });

    } catch (error) {
      console.error("Error fetching tabular users data:", error);
      return sendError(res, error, {
        statusCode: 500,
        code: 'USER_FETCH_FAILED',
        message: 'Error fetching tabular users data',
      });
    }
  });

  
// Create User Route
router.post("/signup", async (req, res) => {
  const userData = req.body;
  try {
    await validateSignupData(userData);
    const user = await createUser(userData);
    res.json({
      message: "User created successfully",
      data: user,
      status: 201,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return sendError(res, error, {
      statusCode: 500,
      code: 'USER_CREATION_FAILED',
      message: 'Error creating user',
    });
  }
})


// Login Route
router.post("/login", async (req, res, next) => {

  const { email, password } = req.body;
  if (!email || !password) {
    return sendError(res, new AppError(400, 'CREDENTIALS_REQUIRED', 'Email and password are required'));
  }
  try {
    const token = await login(email, password);
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
    return sendError(res, error, {
      statusCode: 500,
      code: 'LOGIN_FAILED',
      message: 'Error logging in user',
    });
  }
})

  // Search Users Route
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
    return sendError(res, error, {
      statusCode: 500,
      code: 'USER_SEARCH_FAILED',
      message: 'Error searching users',
    });
  }
});



// Export the router
export default router;


