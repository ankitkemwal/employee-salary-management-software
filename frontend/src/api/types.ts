export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT";
export type EmployeeStatus = "ACTIVE" | "INACTIVE";

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  jobTitle: string;
  country: string;
  employmentType: EmploymentType;
  hireDate: string;
  status: EmployeeStatus;
  salaryAmount: number | null;
  salaryCurrency: string | null;
  salaryEffectiveDate: string | null;
}

export interface SalaryRecord {
  id: string;
  employeeId: string;
  amount: number;
  currency: string;
  effectiveDate: string;
  reason: string | null;
  createdBy: string;
  createdAt: string;
}

export interface ListEmployeesResponse {
  data: Employee[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ListEmployeesFilters {
  search?: string;
  department?: string;
  country?: string;
  employmentType?: EmploymentType;
  minSalary?: number;
  maxSalary?: number;
  status?: EmployeeStatus | "ALL";
  page?: number;
  pageSize?: number;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  jobTitle: string;
  country: string;
  employmentType: EmploymentType;
  hireDate: string;
  salary: {
    amount: number;
    currency: string;
    effectiveDate?: string;
    reason?: string;
  };
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string;
  jobTitle?: string;
  country?: string;
  employmentType?: EmploymentType;
  hireDate?: string;
  status?: EmployeeStatus;
}

export interface CreateSalaryRecordInput {
  amount: number;
  currency: string;
  effectiveDate: string;
  reason?: string;
}

export interface CurrencyStat {
  currency: string;
  headcount: number;
  totalPayroll: number;
  avgSalary: number;
}

export interface DashboardStats {
  activeHeadcount: number;
  byCurrency: CurrencyStat[];
  byDepartment: Array<{ department: string; headcount: number }>;
  byCountry: Array<{ country: string; headcount: number }>;
}

export interface ApiErrorBody {
  error: string;
  message: string;
  details?: unknown;
}
