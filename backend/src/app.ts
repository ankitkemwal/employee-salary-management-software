import express from "express";
import cors from "cors";
import { employeesRouter } from "./routes/employees.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { errorHandler } from "./middleware/error-handler";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/employees", employeesRouter);
  app.use("/api/dashboard", dashboardRouter);

  app.use(errorHandler);

  return app;
}
