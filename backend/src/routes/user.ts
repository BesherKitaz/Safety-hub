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
  sendVerificationEmail,
  verifyEmailAddress,
  getEmailVerificationStatus,
  sendPasswordResetEmail,
  verifyPasswordReset,
  getPasswordResetStatus,
  resetPassword,
  updateUserProfile,
  AppError,
} from '../controllers/userControllers';

import { authMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth"
import prisma from '../lib/prisma';
import { sendError } from '../middleware/errorHandler';
import { authorizeRoles, authorizeStudentSelf, RESOURCE_READER_ROLES } from '../middleware/resourceAuthorization';
import { UserRole } from '@prisma/client';

const router = Router();

/* Email-related routes */
router.post("/send-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || email.trim() === "") {
      return sendError(res, new AppError(400, 'EMAIL_REQUIRED', 'Email is required'));
    }

    const result = await sendVerificationEmail(email);

    return res.status(200).json({
      message: result.message,
      data: {
        email: result.email,
        previewUrl: result.previewUrl,
        requestToken: result.requestToken,
      },
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
    return sendError(res, error, {
      statusCode: 500,
      code: 'EMAIL_VERIFICATION_FAILED',
      message: 'Error sending verification email',
    });
  }
});

router.get('/email-verification/status', async (req, res) => {
  try {
    const requestToken = String(req.query.requestToken ?? '').trim();
    if (!requestToken) return sendError(res, new AppError(400, 'TOKEN_REQUIRED', 'Verification request token is required'));
    return res.json({ message: 'Verification status fetched successfully', data: await getEmailVerificationStatus(requestToken) });
  } catch (error) {
    return sendError(res, error, { statusCode: 400, code: 'EMAIL_VERIFICATION_STATUS_FAILED', message: 'Unable to check verification status' });
  }
});

router.get('/verify-email', async (req, res) => {
  try {
    const token = String(req.query.token ?? '').trim();

    if (!token) {
      return sendError(res, new AppError(400, 'TOKEN_REQUIRED', 'Verification token is required'));
    }

    const result = await verifyEmailAddress(token);

    return res.json({
      message: result.message,
      data: {
        email: result.email,
      },
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    return sendError(res, error, {
      statusCode: 400,
      code: 'EMAIL_VERIFICATION_FAILED',
      message: 'Error verifying email',
    });
  }
});

router.post('/password-reset/request', async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    if (!email) return sendError(res, new AppError(400, 'EMAIL_REQUIRED', 'Email is required'));
    const result = await sendPasswordResetEmail(email);
    return res.json({ message: result.message, data: { requestToken: result.requestToken } });
  } catch (error) {
    return sendError(res, error, { statusCode: 500, code: 'PASSWORD_RESET_REQUEST_FAILED', message: 'Unable to start password reset' });
  }
});

router.get('/password-reset/confirm', async (req, res) => {
  try {
    const token = String(req.query.token ?? '').trim();
    if (!token) return sendError(res, new AppError(400, 'TOKEN_REQUIRED', 'Password reset token is required'));
    const result = await verifyPasswordReset(token);
    return res.json({ message: 'Password reset link verified', data: result });
  } catch (error) {
    return sendError(res, error, { statusCode: 400, code: 'PASSWORD_RESET_CONFIRM_FAILED', message: 'Unable to verify password reset link' });
  }
});

router.get('/password-reset/status', async (req, res) => {
  try {
    const requestToken = String(req.query.requestToken ?? '').trim();
    if (!requestToken) return sendError(res, new AppError(400, 'TOKEN_REQUIRED', 'Password reset request token is required'));
    return res.json({ message: 'Password reset status fetched successfully', data: await getPasswordResetStatus(requestToken) });
  } catch (error) {
    return sendError(res, error, { statusCode: 400, code: 'PASSWORD_RESET_STATUS_FAILED', message: 'Unable to check password reset status' });
  }
});

router.post('/password-reset/complete', async (req, res) => {
  try {
    const credential = typeof req.body?.credential === 'string' ? req.body.credential.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!credential || !password) return sendError(res, new AppError(400, 'RESET_DATA_REQUIRED', 'Reset credential and password are required'));
    await resetPassword(credential, password);
    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    return sendError(res, error, { statusCode: 400, code: 'PASSWORD_RESET_FAILED', message: 'Unable to reset password' });
  }
});

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

  router.get("/profile/:id", authMiddleware, authorizeStudentSelf('id'), async (req: AuthRequest<{ id: string }>, res) => {
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

  router.put("/profile/:id", authMiddleware, authorizeStudentSelf('id'), async (req: AuthRequest<{ id: string }>, res) => {
    try {
      const data = await updateUserProfile(req.user!.userId, req.params.id, req.body);
      return res.json({ message: 'User profile updated successfully', data });
    } catch (error) {
      return sendError(res, error, {
        statusCode: 500,
        code: 'USER_UPDATE_FAILED',
        message: 'Error updating user profile',
      });
    }
  });

  router.get("/tabular/total-rows", authMiddleware, authorizeRoles(UserRole.ADMIN, UserRole.STAFF), async (req: AuthRequest, res) => {
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
  router.get("/tabular", authMiddleware, authorizeRoles(UserRole.ADMIN, UserRole.STAFF), async (req: AuthRequest, res) => {
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
  router.get("/search", authMiddleware, authorizeRoles(...RESOURCE_READER_ROLES), async (req, res) => {
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





