import * as employeeService from "../src/services/employee.service";
import * as salaryService from "../src/services/salary.service";
import { NotFoundError } from "../src/errors";
import { resetDb, makeEmployeeInput } from "./test-utils";

beforeEach(() => resetDb());

describe("addSalaryRecord", () => {
  it("appends a new record without touching prior ones", async () => {
    const employee = await employeeService.createEmployee(
      makeEmployeeInput({ salary: { amount: 90000, currency: "USD" } }),
    );

    await salaryService.addSalaryRecord(employee.id, {
      amount: 100000,
      currency: "USD",
      effectiveDate: "2024-06-01",
      reason: "Annual Review 2024",
    });

    const history = await salaryService.getSalaryHistory(employee.id);
    expect(history).toHaveLength(2);

    const amounts = history.map((r) => r.amount).sort((a, b) => a - b);
    expect(amounts).toEqual([90000, 100000]);
  });

  it("throws NotFoundError for an unknown employee", async () => {
    await expect(
      salaryService.addSalaryRecord("missing", {
        amount: 1,
        currency: "USD",
        effectiveDate: "2024-01-01",
      }),
    ).rejects.toThrow(NotFoundError);
  });
});

describe("getSalaryHistory", () => {
  it("returns records newest-effective-date first", async () => {
    const employee = await employeeService.createEmployee(
      makeEmployeeInput({ hireDate: "2020-01-01", salary: { amount: 80000, currency: "USD" } }),
    );
    await salaryService.addSalaryRecord(employee.id, {
      amount: 90000,
      currency: "USD",
      effectiveDate: "2022-01-01",
      reason: "Annual Review 2022",
    });
    await salaryService.addSalaryRecord(employee.id, {
      amount: 100000,
      currency: "USD",
      effectiveDate: "2024-01-01",
      reason: "Annual Review 2024",
    });

    const history = await salaryService.getSalaryHistory(employee.id);
    expect(history.map((r) => r.effectiveDate)).toEqual(["2024-01-01", "2022-01-01", "2020-01-01"]);
  });
});
