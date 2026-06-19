import { Router } from 'express';
import { authMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth"

import { getLabs } from "../controllers/labsControllers"

const router = Router();

router.use(authMiddleware);


router.get("/", async (req: AuthRequest, res) => {
  try {
    const labs = await getLabs();
    res.json({
        message: "Labs fetched successfully",
        data: labs
    });
  } catch (error) {
    console.error("Error fetching labs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


export default router;

