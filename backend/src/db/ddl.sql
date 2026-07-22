CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  employee_code TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  job_title TEXT NOT NULL,
  country TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  hire_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL DEFAULT (current_timestamp),
  updated_at TEXT NOT NULL DEFAULT (current_timestamp)
);

CREATE UNIQUE INDEX IF NOT EXISTS employees_employee_code_idx ON employees (employee_code);
CREATE UNIQUE INDEX IF NOT EXISTS employees_email_idx ON employees (email);
CREATE INDEX IF NOT EXISTS employees_department_idx ON employees (department);
CREATE INDEX IF NOT EXISTS employees_country_idx ON employees (country);
CREATE INDEX IF NOT EXISTS employees_status_idx ON employees (status);

CREATE TABLE IF NOT EXISTS salary_records (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id),
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  effective_date TEXT NOT NULL,
  reason TEXT,
  created_by TEXT NOT NULL DEFAULT 'hr-manager',
  created_at TEXT NOT NULL DEFAULT (current_timestamp)
);

CREATE INDEX IF NOT EXISTS salary_records_employee_id_idx ON salary_records (employee_id);
CREATE INDEX IF NOT EXISTS salary_records_effective_date_idx ON salary_records (effective_date);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'hr-manager',
  changed_at TEXT NOT NULL DEFAULT (current_timestamp),
  before_snapshot TEXT,
  after_snapshot TEXT
);

CREATE INDEX IF NOT EXISTS audit_logs_table_record_idx ON audit_logs (table_name, record_id);
