import { Router } from 'express';
import { authMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth"

import { getLabs, getLabsNamesAndIds, getLabById } from "../controllers/labsControllers"

const router = Router();

router.use(authMiddleware);


router.get("/", async (req: AuthRequest, res) => {
  try {
    const labs = await getLabs();
    console.log("Labs fetched successfully:", labs);
    res.json({
        message: "Labs fetched successfully",
        data: labs
    });
  } catch (error) {
    console.error("Error fetching labs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/listings", async (req: AuthRequest, res) => {
  try {
    const labs = await getLabsNamesAndIds();
    res.json({
        message: "Labs fetched successfully",
        data: labs
    });
  } catch (error) {
    console.error("Error fetching labs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:labId", async (req: AuthRequest, res) => {
  try {
    const { labId } = req.params;
    if (!labId) {
      return res.status(400).json({ error: "Lab ID is required" });
    }
    const lab = await getLabById(labId);
    if (!lab) {
      return res.status(404).json({ error: "Lab not found" });
    }
    res.json({
      message: "Lab fetched successfully",
      data: lab
    });
  } catch (error) {
    console.error("Error fetching lab:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


export default router;

