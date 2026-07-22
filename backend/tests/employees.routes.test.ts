import request from "supertest";
import { createApp } from "../src/app";
import { resetDb, makeEmployeeInput } from "./test-utils";

const app = createApp();

beforeEach(() => resetDb());

describe("POST /api/employees", () => {
  it("creates an employee with an initial salary", async () => {
    const res = await request(app).post("/api/employees").send(makeEmployeeInput());

    expect(res.status).toBe(201);
    expect(res.body.employeeCode).toBe("EMP-00001");
  });

  it("returns 400 for invalid input", async () => {
    const res = await request(app).post("/api/employees").send({ firstName: "OnlyThis" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ValidationError");
  });

  it("returns 409 for a duplicate email", async () => {
    await request(app).post("/api/employees").send(makeEmployeeInput({ email: "dup@acme.com" }));
    const res = await request(app)
      .post("/api/employees")
      .send(makeEmployeeInput({ email: "dup@acme.com" }));

    expect(res.status).toBe(409);
  });
});

describe("GET /api/employees/:id", () => {
  it("returns 404 for an unknown id", async () => {
    const res = await request(app).get("/api/employees/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("returns the employee for a known id", async () => {
    const created = await request(app).post("/api/employees").send(makeEmployeeInput());
    const res = await request(app).get(`/api/employees/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });
});

describe("PUT/DELETE /api/employees/:id", () => {
  it("updates fields and soft-deletes on DELETE", async () => {
    const created = await request(app).post("/api/employees").send(makeEmployeeInput());
    const id = created.body.id;

    const updateRes = await request(app).put(`/api/employees/${id}`).send({ jobTitle: "Staff Engineer" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.jobTitle).toBe("Staff Engineer");

    const deleteRes = await request(app).delete(`/api/employees/${id}`);
    expect(deleteRes.status).toBe(204);

    const listRes = await request(app).get("/api/employees");
    expect(listRes.body.data.find((e: any) => e.id === id)).toBeUndefined();
  });
});

describe("salary sub-resource", () => {
  it("appends salary history and returns it newest-first", async () => {
    const created = await request(app).post("/api/employees").send(makeEmployeeInput());
    const id = created.body.id;

    const addRes = await request(app)
      .post(`/api/employees/${id}/salary`)
      .send({ amount: 100000, currency: "USD", effectiveDate: "2025-01-01", reason: "Annual Review" });
    expect(addRes.status).toBe(201);

    const historyRes = await request(app).get(`/api/employees/${id}/salary`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body).toHaveLength(2);
    expect(historyRes.body[0].amount).toBe(100000);
  });
});

describe("GET /api/employees/export", () => {
  it("returns CSV with a header row and one row per employee", async () => {
    await request(app).post("/api/employees").send(makeEmployeeInput({ firstName: "Csv" }));

    const res = await request(app).get("/api/employees/export");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    const lines = res.text.trim().split("\n");
    expect(lines[0]).toContain("employeeCode");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("Csv");
  });
});

describe("GET /api/dashboard/stats", () => {
  it("returns headcount and per-currency payroll", async () => {
    await request(app).post("/api/employees").send(makeEmployeeInput());
    const res = await request(app).get("/api/dashboard/stats");

    expect(res.status).toBe(200);
    expect(res.body.activeHeadcount).toBe(1);
    expect(res.body.byCurrency[0]).toMatchObject({ currency: "USD", headcount: 1 });
  });
});
