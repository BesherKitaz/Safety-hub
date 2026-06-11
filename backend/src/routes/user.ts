import { Router } from 'express';


import { getUserDataById, createUser, login } from '../controllers/userController';

const router = Router();

/* user routes */

router.get("/", (req, res) => {
  res.json({ message: "Hello from user" });
});


  router.get("/profile/:id", async (req, res) => {
    const id = req.params.id
    try {
      const data = await getUserDataById(id);
      res.json({
        message: "User profile",
        data
      });

    } catch (error) {
      res.status(500).json({
        message: `Error fetching user profile: ${error}`
      });
    }
  });

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
      message: `Error creating user: ${error}`
    });
  }
})

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const token = await login(email, password, next);
    res.json({
      message: "User logged in successfully",
      data: token,
      status: 200,
    });
  } catch (error) {
    res.status(500).json({
      message: `Error logging in user: ${error}`
    });
  }
})

export default router;