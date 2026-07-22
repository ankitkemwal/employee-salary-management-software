import { Router } from "express";
import { asyncHandler } from "../middleware/error-handler";
import * as employeeService from "../services/employee.service";
import * as salaryService from "../services/salary.service";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  listEmployeesQuerySchema,
} from "../validation/employee.schema";
import { createSalaryRecordSchema } from "../validation/salary.schema";
import { toCsv } from "../utils/csv";

export const employeesRouter = Router();

// Registered before "/:id" so the literal path wins.
employeesRouter.get(
  "/export",
  asyncHandler(async (req, res) => {
    const filters = listEmployeesQuerySchema
      .omit({ page: true, pageSize: true })
      .parse(req.query);
    const rows = await employeeService.exportEmployees(filters);
    const csv = toCsv(rows);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="employees-export.csv"');
    res.send(csv);
  }),
);

employeesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = listEmployeesQuerySchema.parse(req.query);
    res.json(await employeeService.listEmployees(query));
  }),
);

employeesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createEmployeeSchema.parse(req.body);
    const employee = await employeeService.createEmployee(input);
    res.status(201).json(employee);
  }),
);

employeesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await employeeService.getEmployeeById(req.params.id));
  }),
);

employeesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = updateEmployeeSchema.parse(req.body);
    res.json(await employeeService.updateEmployee(req.params.id, input));
  }),
);

employeesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await employeeService.softDeleteEmployee(req.params.id);
    res.status(204).send();
  }),
);

employeesRouter.get(
  "/:id/salary",
  asyncHandler(async (req, res) => {
    res.json(await salaryService.getSalaryHistory(req.params.id));
  }),
);

employeesRouter.post(
  "/:id/salary",
  asyncHandler(async (req, res) => {
    const input = createSalaryRecordSchema.parse(req.body);
    const record = await salaryService.addSalaryRecord(req.params.id, input);
    res.status(201).json(record);
  }),
);
