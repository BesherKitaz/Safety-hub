import { Router } from 'express';
import { authMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth"

import collectStats from "../controllers/statsController"

const router = Router();

router.use(authMiddleware);


router.get('/', async (req: AuthRequest, res) => {
    // Your stats logic here
    try {
        const stats = await collectStats();
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: "Failed to collect stats" });
    }
});















export default router;
