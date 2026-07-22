import { z } from "zod";
import { EMPLOYMENT_TYPES, EMPLOYEE_STATUSES } from "../db/schema";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const employeeInputSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  department: z.string().trim().min(1),
  jobTitle: z.string().trim().min(1),
  country: z
    .string()
    .trim()
    .length(2)
    .transform((v) => v.toUpperCase()),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  hireDate: isoDate,
});

export const createEmployeeSchema = employeeInputSchema.extend({
  salary: z.object({
    amount: z.number().positive(),
    currency: z
      .string()
      .trim()
      .length(3)
      .transform((v) => v.toUpperCase()),
    effectiveDate: isoDate.optional(),
    reason: z.string().trim().min(1).optional(),
  }),
});

export const updateEmployeeSchema = employeeInputSchema
  .extend({
    status: z.enum(EMPLOYEE_STATUSES),
  })
  .partial();

export const listEmployeesQuerySchema = z.object({
  search: z.string().trim().optional(),
  department: z.string().trim().optional(),
  country: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
  minSalary: z.coerce.number().nonnegative().optional(),
  maxSalary: z.coerce.number().nonnegative().optional(),
  status: z.enum([...EMPLOYEE_STATUSES, "ALL"]).optional().default("ACTIVE"),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(200).optional().default(25),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
