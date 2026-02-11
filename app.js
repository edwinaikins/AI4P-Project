import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import analyseRoutes from './routes/analyse.route.js';
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";


const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', analyseRoutes);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(config.PORT, () => {
  console.log(`✅ API running at http://localhost:${config.PORT}`);
});
