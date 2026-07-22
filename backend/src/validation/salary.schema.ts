import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const createSalaryRecordSchema = z.object({
  amount: z.number().positive(),
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((v) => v.toUpperCase()),
  effectiveDate: isoDate,
  reason: z.string().trim().min(1).optional(),
});

export type CreateSalaryRecordInput = z.infer<typeof createSalaryRecordSchema>;
