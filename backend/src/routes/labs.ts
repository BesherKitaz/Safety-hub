import { Router } from 'express';
import { authMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth"

import {
  getLabs,
  getLabsNamesAndIds,
  getDeactivatedLabs,
  getLabById,
  getToolsByLabId,
  getTrainingNodesByLabId,
  createLab,
  updateLab,
  deactivateLab,
  activateLab,
  AppError,
} from "../controllers/labsControllers"
import { isUserAdmin } from "../util/checkRoles";
import { sendError } from '../middleware/errorHandler';

const router = Router();

router.use(authMiddleware);

const handleLabError = (res: any, error: unknown, fallback: string) =>
  sendError(res, error, { statusCode: 500, code: 'LAB_REQUEST_FAILED', message: fallback });

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const labs = await getLabs();
    res.json({
      message: "Labs fetched successfully",
      data: labs
    });
  } catch (error) {
    handleLabError(res, error, "Internal server error");
  }
});

router.get("/listings", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const labs = await getLabsNamesAndIds();
    res.json({
      message: "Labs fetched successfully",
      data: labs
    });
  } catch (error) {
    handleLabError(res, error, "Internal server error");
  }
});

router.get("/deactivated", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const labs = await getDeactivatedLabs();
    res.json({
      message: "Deactivated labs fetched successfully",
      data: labs,
    });
  } catch (error) {
    handleLabError(res, error, "Internal server error");
  }
});

router.post("/create", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  if (!(await isUserAdmin(userId))) {
    return sendError(res, new AppError(403, 'FORBIDDEN', 'Access denied. Admin privileges required.'));
  }

  try {
    const createdLab = await createLab(req.body);
    res.status(201).json({
      message: "Lab created successfully",
      data: createdLab,
    });
  } catch (error) {
    handleLabError(res, error, "Failed to create lab");
  }
});

router.put("/update/:labId", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  if (!(await isUserAdmin(userId))) {
    return sendError(res, new AppError(403, 'FORBIDDEN', 'Access denied. Admin privileges required.'));
  }

  try {
    const { labId: rawLabId } = req.params;
    const labId = rawLabId ?? '';
    const updatedLab = await updateLab(labId, req.body);
    res.json({
      message: "Lab updated successfully",
      data: updatedLab,
    });
  } catch (error) {
    handleLabError(res, error, "Failed to update lab");
  }
});

router.patch("/:labId/deactivate", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  if (!(await isUserAdmin(userId))) {
    return sendError(res, new AppError(403, 'FORBIDDEN', 'Access denied. Admin privileges required.'));
  }

  try {
    const { labId: rawLabId } = req.params;
    const labId = rawLabId ?? '';
    const updatedLab = await deactivateLab(labId);
    res.json({
      message: "Lab deactivated successfully",
      data: updatedLab,
    });
  } catch (error) {
    handleLabError(res, error, "Failed to deactivate lab");
  }
});

router.patch("/:labId/activate", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  if (!(await isUserAdmin(userId))) {
    return sendError(res, new AppError(403, 'FORBIDDEN', 'Access denied. Admin privileges required.'));
  }

  try {
    const { labId: rawLabId } = req.params;
    const labId = rawLabId ?? '';
    const updatedLab = await activateLab(labId);
    res.json({
      message: "Lab activated successfully",
      data: updatedLab,
    });
  } catch (error) {
    handleLabError(res, error, "Failed to activate lab");
  }
});

router.get("/:labId", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { labId } = req.params;
    if (!labId) {
      return sendError(res, new AppError(400, 'LAB_ID_REQUIRED', 'Lab ID is required'));
    }
    const lab = await getLabById(labId);
    if (!lab) {
      return sendError(res, new AppError(404, 'LAB_NOT_FOUND', 'Lab not found'));
    }
    res.json({
      message: "Lab fetched successfully",
      data: lab
    });
  } catch (error) {
    handleLabError(res, error, "Internal server error");
  }
});

router.get("/:labId/tools", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { labId } = req.params;
    if (!labId) {
      return sendError(res, new AppError(400, 'LAB_ID_REQUIRED', 'Lab ID is required'));
    }
    const tools = await getToolsByLabId(labId);
    res.json({
      message: "Tools fetched successfully",
      data: tools
    });
  } catch (error) {
    handleLabError(res, error, "Internal server error");
  }
});

router.get("/:labId/trainingNodes", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { labId } = req.params;
    if (!labId) {
      return sendError(res, new AppError(400, 'LAB_ID_REQUIRED', 'Lab ID is required'));
    }
    const trainingNodes = await getTrainingNodesByLabId(labId);
    if (!trainingNodes) {
      return sendError(res, new AppError(404, 'TRAINING_NODES_NOT_FOUND', 'Training nodes not found'));
    }
    res.json({
      message: "Training nodes fetched successfully",
      data: trainingNodes
    });
  } catch (error) {
    handleLabError(res, error, "Internal server error");
  }
});

export default router;
