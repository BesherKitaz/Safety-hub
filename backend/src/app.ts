import express from 'express';
import cors from 'cors';

import userRoutes from './routes/user';
import statsRoutes from './routes/stats';
import CertiRoutes from './routes/certifications'
import labsRoutes from './routes/labs'
import toolsRoutes from './routes/tools'
import trainingsRoutes from './routes/trainings'
import academicsRoutes from './routes/academics';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
const app = express();


// Support CORS and JSON parsing
app.use(cors())
app.use(express.json());


// Static files are application data too; keep them behind authentication and
// away from the API route namespace so a file cannot shadow a protected route.
app.use("/api/public", authMiddleware, express.static('public'));
app.use("/api/uploads", authMiddleware, express.static('uploads'));


//Serving different routes
app.use("/api/user", userRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/certifications", CertiRoutes);
app.use("/api/labs", labsRoutes);
app.use("/api/tools", toolsRoutes);
app.use("/api/trainings", trainingsRoutes);
app.use("/api/academics", academicsRoutes);

app.use(errorHandler);


export default app;
