import express from 'express';
import cors from 'cors';

import userRoutes from './routes/user';
import statsRoutes from './routes/stats';
import CertiRoutes from './routes/certifications'
import labsRoutes from './routes/labs'
import toolsRoutes from './routes/tools'
import trainingsRoutes from './routes/trainings'
import { errorHandler } from './middleware/errorHandler';
const app = express();


// Support CORS and JSON parsing
app.use(cors())
app.use(express.json());


// Static apis and file serving
app.use("/api", express.static('public'));
app.use("/api", express.static('uploads'));


//Serving different routes
app.use("/api/user", userRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/certifications", CertiRoutes);
app.use("/api/labs", labsRoutes);
app.use("/api/tools", toolsRoutes);
app.use("/api/trainings", trainingsRoutes);

app.use(errorHandler);


export default app;