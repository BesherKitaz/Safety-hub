import { Router } from 'express';


import { getUserDataById } from '../controllers/userController';

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



export default router;