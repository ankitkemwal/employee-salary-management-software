import * as employeeService from "../src/services/employee.service";
import * as dashboardService from "../src/services/dashboard.service";
import { resetDb, makeEmployeeInput } from "./test-utils";

beforeEach(() => resetDb());

describe("getDashboardStats", () => {
  it("groups payroll totals per currency instead of summing across currencies", async () => {
    await employeeService.createEmployee(
      makeEmployeeInput({ salary: { amount: 100000, currency: "USD" } }),
    );
    await employeeService.createEmployee(
      makeEmployeeInput({ salary: { amount: 200000, currency: "USD" } }),
    );
    await employeeService.createEmployee(
      makeEmployeeInput({ salary: { amount: 1000000, currency: "INR" } }),
    );

    const stats = await dashboardService.getDashboardStats();

    expect(stats.activeHeadcount).toBe(3);

    const usd = stats.byCurrency.find((c) => c.currency === "USD");
    const inr = stats.byCurrency.find((c) => c.currency === "INR");

    expect(usd).toMatchObject({ headcount: 2, totalPayroll: 300000, avgSalary: 150000 });
    expect(inr).toMatchObject({ headcount: 1, totalPayroll: 1000000, avgSalary: 1000000 });
  });

  it("excludes inactive employees from headcount and payroll", async () => {
    const active = await employeeService.createEmployee(makeEmployeeInput());
    const toDeactivate = await employeeService.createEmployee(makeEmployeeInput());
    await employeeService.softDeleteEmployee(toDeactivate.id);

    const stats = await dashboardService.getDashboardStats();
    expect(stats.activeHeadcount).toBe(1);
    expect(stats.byCurrency.find((c) => c.currency === "USD")?.headcount).toBe(1);
  });

  it("counts headcount by department and country", async () => {
    await employeeService.createEmployee(
      makeEmployeeInput({ department: "Sales", country: "IN" }),
    );
    await employeeService.createEmployee(
      makeEmployeeInput({ department: "Sales", country: "US" }),
    );

    const stats = await dashboardService.getDashboardStats();
    expect(stats.byDepartment.find((d) => d.department === "Sales")?.headcount).toBe(2);
    expect(stats.byCountry.find((c) => c.country === "IN")?.headcount).toBe(1);
  });
});
