import type {
  ApiErrorBody,
  CreateEmployeeInput,
  CreateSalaryRecordInput,
  DashboardStats,
  Employee,
  ListEmployeesFilters,
  ListEmployeesResponse,
  SalaryRecord,
  UpdateEmployeeInput,
} from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    throw new ApiError(res.status, isJson ? body : { error: "Error", message: String(body) });
  }
  return body as T;
}

function toQueryString(filters: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  listEmployees(filters: ListEmployeesFilters): Promise<ListEmployeesResponse> {
    return request(`/employees${toQueryString(filters)}`);
  },

  getEmployee(id: string): Promise<Employee> {
    return request(`/employees/${id}`);
  },

  createEmployee(input: CreateEmployeeInput): Promise<Employee> {
    return request("/employees", { method: "POST", body: JSON.stringify(input) });
  },

  updateEmployee(id: string, input: UpdateEmployeeInput): Promise<Employee> {
    return request(`/employees/${id}`, { method: "PUT", body: JSON.stringify(input) });
  },

  deactivateEmployee(id: string): Promise<void> {
    return request(`/employees/${id}`, { method: "DELETE" });
  },

  getSalaryHistory(employeeId: string): Promise<SalaryRecord[]> {
    return request(`/employees/${employeeId}/salary`);
  },

  addSalaryRecord(employeeId: string, input: CreateSalaryRecordInput): Promise<SalaryRecord> {
    return request(`/employees/${employeeId}/salary`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  exportUrl(filters: Omit<ListEmployeesFilters, "page" | "pageSize">): string {
    return `${BASE_URL}/employees/export${toQueryString(filters)}`;
  },

  getDashboardStats(): Promise<DashboardStats> {
    return request("/dashboard/stats");
  },
};
