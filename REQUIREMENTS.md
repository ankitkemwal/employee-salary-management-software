# ACME Salary Management System
**Requirements Document · v1.0 · July 2025**

---

## 1. Goal

Replace ACME's Excel-based salary process with a web application that gives HR Managers a single source of truth for compensation data across 10,000 employees in multiple countries. The system should make it fast to find, update, and report on salary data — tasks that currently require juggling multiple spreadsheets.

---

## 2. Who It's For

| | |
|---|---|
| **User** | HR Manager — comfortable with web apps, not a developer |
| **Scale** | 10,000 employees · multi-country · up to ~20 concurrent HR users |
| **Key jobs** | Look up an employee's salary · update it · see salary history · view org-level stats |

---

## 3. Architectural Decisions

These are choices I own. Each one is a deliberate call, not a default.

**Currency — multiple local currencies, no cross-currency aggregation**
Each salary record stores an `amount` + `currency` (ISO 4217, e.g. USD, INR, GBP). Salaries are never converted or summed across currencies — doing so would produce a meaningless number without live FX rates. The dashboard groups all stats (total payroll, average salary) per currency. This is honest and safe; a currency-conversion layer can be added in v2 with a real FX feed.

**Salary history — append-only, full history kept**
When a salary changes, a new `salary_record` row is inserted with an `effective_date` and optional `reason` (e.g. "Annual Review 2025"). The old record is never touched. This gives a complete audit trail, makes rollbacks trivial, and matches how payroll teams actually think about compensation over time. The UI shows the latest salary by default and exposes a history view per employee.

**Delete — soft delete only**
Employees are never hard-deleted. A `status` field flips from `ACTIVE` to `INACTIVE`. This preserves historical salary data and audit logs. The HR Manager sees only active employees by default, with an option to view inactive ones.

**Auth — mock single session**
A hardcoded HR Manager session is assumed. No login screen, no tokens. The `created_by` / `actor` fields in salary records and audit logs are set to `"hr-manager"`. Real auth (OAuth/SSO) would be wired in during production onboarding — the schema already supports it.

---

## 4. Scope & Features

| Feature | Why it's in scope | Priority |
|---|---|---|
| Employee directory | Core. Replaces the main Excel sheet. | Must |
| Add / edit / soft-delete employee | Core CRUD. Records are never destroyed. | Must |
| Salary history per employee | Append-only log — every change is preserved with effective date + reason. | Must |
| Search & filter | Filter by name, department, country, employment type, salary range. | Must |
| Summary dashboard | Headcount, total payroll, avg salary — grouped by currency, dept, country. | Should |
| CSV export | Export current filtered view for payroll hand-off. | Should |
| Audit log | Every write records actor + timestamp + before/after snapshot. | Should |

---

## 5. Deliberately Left Out

| Left out | Reason |
|---|---|
| Leave records & LWP | Out of stated scope. A separate attendance/leave module concern. Noted as explicit exclusion per Incubyte guidance. |
| Annual appraisal workflows | Appraisal cycles, approval chains, and performance ratings are a separate HR domain. A salary change from an appraisal is just a new salary record with reason = "Annual Review". |
| Payroll processing & payslips | This system manages data. Tax, deductions, and payslip generation are a payroll engine concern. |
| CSV bulk import | Descoped to keep initial delivery focused. The data model and API are import-ready; this is a straightforward addition in v2. |
| Role-based access control | Single HR Manager role assumed. Multi-permission UI adds complexity without changing core value for this assessment. |
| Currency conversion / FX rates | Requires a live FX feed and adds complexity. Grouping by currency is safe and correct. |
| Mobile native app | Web UI only per the brief. Responsive design ensured. |

---

## 6. Technical Choices

| | |
|---|---|
| **Backend** | Node.js 20 + Express + TypeScript |
| **ORM** | Drizzle ORM — lightweight, type-safe, SQL-first; no magic, easy to reason about |
| **Database** | SQLite for assessment (zero-config, file-based). Drizzle makes swapping to Postgres straightforward. |
| **Frontend** | React 18 + Vite + Tailwind CSS + TypeScript |
| **UI components** | shadcn/ui — accessible, unstyled primitives, no vendor lock-in |
| **Validation** | Zod — request validation at the route boundary |
| **Testing** | Jest + Supertest on the service layer. Fast, deterministic, no browser needed. |
| **Seed** | Faker.js — 10,000 employees across 15 departments and 20 countries |
| **Deploy** | Vercel (frontend) + Railway (backend) |

---

## 7. Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Browser (UI tier)                  │
│                                                      │
│   React 18 + Vite · Tailwind CSS · shadcn/ui         │
│                                                      │
│  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Employee    │  │  Add / Edit │  │  Dashboard  │  │
│  │ table+search │  │    forms    │  │  & reports  │  │
│  └──────────────┘  └─────────────┘  └─────────────┘  │
└───────────────────────┬──────────────────────────────┘
                        │  REST API (JSON)
┌───────────────────────▼──────────────────────────────┐
│                API tier (Node.js + Express)           │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │    Routes    │→ │ Service layer│→ │ Audit log  │  │
│  │  /employees  │  │ business     │  │ who·what   │  │
│  │  /salary     │  │ logic +      │  │ ·when      │  │
│  │  /dashboard  │  │ validation   │  │            │  │
│  └──────────────┘  └──────┬───────┘  └────────────┘  │
└──────────────────────────┬───────────────────────────┘
                           │  Drizzle ORM
┌──────────────────────────▼───────────────────────────┐
│                  Data tier (SQLite)                   │
│                                                      │
│   employees · salary_records · audit_logs            │
│                                                      │
│  ┌───────────────────┐  ┌──────────────────────────┐  │
│  │   Seed script     │  │  Jest + Supertest        │  │
│  │ Faker · 10k rows  │  │  unit tests on services  │  │
│  └───────────────────┘  └──────────────────────────┘  │
└──────────────────────────────────────────────────────┘

Deploy: Vercel (frontend) + Railway (backend)
Swap SQLite → Postgres for production (one config change via Drizzle)
```

### Data model

**employees**
- `id` (UUID), `employee_id` (e.g. EMP-00042), `first_name`, `last_name`, `email`
- `department`, `job_title`, `country` (ISO 3166), `employment_type` (FULL_TIME / PART_TIME / CONTRACT)
- `hire_date`, `status` (ACTIVE / INACTIVE), `created_at`, `updated_at`

**salary_records** — append-only, never mutated
- `id`, `employee_id` (FK), `amount` (DECIMAL), `currency` (ISO 4217)
- `effective_date`, `reason` (optional — e.g. "Annual Review 2025"), `created_by`, `created_at`

**audit_logs**
- `id`, `table_name`, `record_id`, `action` (INSERT / UPDATE / DELETE)
- `actor`, `changed_at`, `before_snapshot` (JSON), `after_snapshot` (JSON)

### API routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/employees` | Paginated list — `?search`, `?dept`, `?country`, `?employmentType`, `?minSalary`, `?maxSalary`, `?status`, `?page`, `?pageSize` |
| POST | `/api/employees` | Create employee + initial salary (single transaction) |
| GET | `/api/employees/:id` | Single employee + current salary |
| PUT | `/api/employees/:id` | Update employee fields |
| DELETE | `/api/employees/:id` | Soft-delete (status → INACTIVE) |
| GET | `/api/employees/:id/salary` | Full salary history, newest first |
| POST | `/api/employees/:id/salary` | Add new salary record (append-only) |
| GET | `/api/employees/export` | CSV export of current filtered view (same filters as list, no pagination) |
| GET | `/api/dashboard/stats` | Headcount, payroll totals, avg salary — grouped by currency, department, country |
