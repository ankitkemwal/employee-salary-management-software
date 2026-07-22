import { sqlite } from "../src/db/client";
import * as employeeService from "../src/services/employee.service";
import { NotFoundError, ConflictError } from "../src/errors";
import { resetDb, makeEmployeeInput } from "./test-utils";

beforeEach(() => resetDb());

describe("createEmployee", () => {
  it("creates the employee and its initial salary record in one transaction", async () => {
    const employee = await employeeService.createEmployee(makeEmployeeInput());

    expect(employee.employeeCode).toBe("EMP-00001");
    expect(employee.status).toBe("ACTIVE");

    const salaryRows = sqlite
      .prepare("SELECT * FROM salary_records WHERE employee_id = ?")
      .all(employee.id);
    expect(salaryRows).toHaveLength(1);
    expect((salaryRows[0] as any).amount).toBe(90000);
  });

  it("assigns sequential, zero-padded employee codes", async () => {
    const first = await employeeService.createEmployee(makeEmployeeInput());
    const second = await employeeService.createEmployee(makeEmployeeInput());
    expect(first.employeeCode).toBe("EMP-00001");
    expect(second.employeeCode).toBe("EMP-00002");
  });

  it("rejects a duplicate email with a ConflictError", async () => {
    await employeeService.createEmployee(makeEmployeeInput({ email: "dup@acme.com" }));
    await expect(
      employeeService.createEmployee(makeEmployeeInput({ email: "dup@acme.com" })),
    ).rejects.toThrow(ConflictError);
  });

  it("writes audit log rows for both the employee and its initial salary", async () => {
    const employee = await employeeService.createEmployee(makeEmployeeInput());

    const auditRows = sqlite
      .prepare("SELECT * FROM audit_logs WHERE record_id = ? OR table_name = 'salary_records'")
      .all(employee.id) as any[];

    const employeeAudit = auditRows.find((r) => r.table_name === "employees");
    const salaryAudit = auditRows.find((r) => r.table_name === "salary_records");

    expect(employeeAudit).toMatchObject({ action: "INSERT", actor: "hr-manager" });
    expect(salaryAudit).toMatchObject({ action: "INSERT", actor: "hr-manager" });
    expect(JSON.parse(employeeAudit.after_snapshot).id).toBe(employee.id);
  });
});

describe("getEmployeeById", () => {
  it("returns the employee with its current salary", async () => {
    const created = await employeeService.createEmployee(makeEmployeeInput());
    const found = await employeeService.getEmployeeById(created.id);
    expect(found.salaryAmount).toBe(90000);
    expect(found.salaryCurrency).toBe("USD");
  });

  it("throws NotFoundError for an unknown id", async () => {
    await expect(employeeService.getEmployeeById("missing")).rejects.toThrow(NotFoundError);
  });
});

describe("updateEmployee", () => {
  it("updates only the provided fields and records a before/after audit entry", async () => {
    const created = await employeeService.createEmployee(makeEmployeeInput({ jobTitle: "SWE I" }));

    const updated = await employeeService.updateEmployee(created.id, { jobTitle: "SWE II" });

    expect(updated?.jobTitle).toBe("SWE II");
    expect(updated?.firstName).toBe(created.firstName);

    const audit = sqlite
      .prepare("SELECT * FROM audit_logs WHERE record_id = ? AND action = 'UPDATE'")
      .get(created.id) as any;
    expect(JSON.parse(audit.before_snapshot).jobTitle).toBe("SWE I");
    expect(JSON.parse(audit.after_snapshot).jobTitle).toBe("SWE II");
  });

  it("throws NotFoundError for an unknown id", async () => {
    await expect(employeeService.updateEmployee("missing", { jobTitle: "X" })).rejects.toThrow(
      NotFoundError,
    );
  });
});

describe("softDeleteEmployee", () => {
  it("flips status to INACTIVE instead of removing the row", async () => {
    const created = await employeeService.createEmployee(makeEmployeeInput());
    await employeeService.softDeleteEmployee(created.id);

    const row = sqlite.prepare("SELECT * FROM employees WHERE id = ?").get(created.id) as any;
    expect(row).toBeDefined();
    expect(row.status).toBe("INACTIVE");
  });

  it("excludes soft-deleted employees from the default (active-only) listing", async () => {
    const created = await employeeService.createEmployee(makeEmployeeInput());
    await employeeService.softDeleteEmployee(created.id);

    const activeList = await employeeService.listEmployees({
      status: "ACTIVE",
      page: 1,
      pageSize: 25,
    });
    expect(activeList.data.find((e) => e.id === created.id)).toBeUndefined();

    const allList = await employeeService.listEmployees({ status: "ALL", page: 1, pageSize: 25 });
    expect(allList.data.find((e) => e.id === created.id)?.status).toBe("INACTIVE");
  });
});

describe("listEmployees", () => {
  it("filters by department, country, and search term", async () => {
    await employeeService.createEmployee(
      makeEmployeeInput({ firstName: "Alice", department: "Sales", country: "IN" }),
    );
    await employeeService.createEmployee(
      makeEmployeeInput({ firstName: "Bob", department: "Engineering", country: "US" }),
    );

    const byDept = await employeeService.listEmployees({
      status: "ACTIVE",
      department: "Sales",
      page: 1,
      pageSize: 25,
    });
    expect(byDept.data).toHaveLength(1);
    expect(byDept.data[0].firstName).toBe("Alice");

    const bySearch = await employeeService.listEmployees({
      status: "ACTIVE",
      search: "bob",
      page: 1,
      pageSize: 25,
    });
    expect(bySearch.data).toHaveLength(1);
    expect(bySearch.data[0].firstName).toBe("Bob");
  });

  it("matches a combined 'first last' search term", async () => {
    await employeeService.createEmployee(
      makeEmployeeInput({ firstName: "Jane", lastName: "Doe" }),
    );

    const result = await employeeService.listEmployees({
      status: "ACTIVE",
      search: "jane doe",
      page: 1,
      pageSize: 25,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].lastName).toBe("Doe");
  });

  it("paginates results", async () => {
    for (let i = 0; i < 5; i++) {
      await employeeService.createEmployee(makeEmployeeInput());
    }

    const page1 = await employeeService.listEmployees({ status: "ALL", page: 1, pageSize: 2 });
    const page2 = await employeeService.listEmployees({ status: "ALL", page: 2, pageSize: 2 });

    expect(page1.data).toHaveLength(2);
    expect(page2.data).toHaveLength(2);
    expect(page1.total).toBe(5);
    expect(page1.data[0].id).not.toBe(page2.data[0].id);
  });

  it("filters by salary range using the employee's current salary", async () => {
    await employeeService.createEmployee(
      makeEmployeeInput({ salary: { amount: 50000, currency: "USD" } }),
    );
    await employeeService.createEmployee(
      makeEmployeeInput({ salary: { amount: 150000, currency: "USD" } }),
    );

    const result = await employeeService.listEmployees({
      status: "ALL",
      minSalary: 100000,
      page: 1,
      pageSize: 25,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].salaryAmount).toBe(150000);
  });
});
