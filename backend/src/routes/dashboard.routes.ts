import { Router } from "express";
import { asyncHandler } from "../middleware/error-handler";
import * as dashboardService from "../services/dashboard.service";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    res.json(await dashboardService.getDashboardStats());
  }),
);
