import { Router } from 'express';
import { authMiddleware } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth"

import collectStats from "../controllers/statsControllers"
import { sendError } from '../middleware/errorHandler';
import { authorizeRoles, RESOURCE_READER_ROLES } from '../middleware/resourceAuthorization';

const router = Router();

router.use(authMiddleware);


router.get('/', authorizeRoles(...RESOURCE_READER_ROLES), async (req: AuthRequest, res) => {
    // Your stats logic here
    try {
        const stats = await collectStats();
        res.status(200).json({ 
            message: "Stats collected successfully",
            data: stats
         });
    } catch (error) {
        return sendError(res, error, { statusCode: 500, code: 'STATS_COLLECTION_FAILED', message: 'Failed to collect stats' });
    }
});















export default router;
