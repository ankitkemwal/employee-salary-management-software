import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Plus } from "lucide-react";
import { api } from "@/api/client";
import type { Employee, EmploymentType } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { Pagination } from "@/components/pagination";
import { DEPARTMENTS, COUNTRY_CODES, countryName, EMPLOYMENT_TYPES } from "@/lib/constants";
import { formatMoney, formatEmploymentType } from "@/lib/format";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const PAGE_SIZE = 25;

export function EmployeeListPage() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [country, setCountry] = useState("");
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">("");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);
  const debouncedMinSalary = useDebouncedValue(minSalary, 300);
  const debouncedMaxSalary = useDebouncedValue(maxSalary, 300);

  const filters = {
    search: debouncedSearch || undefined,
    department: department || undefined,
    country: country || undefined,
    employmentType: employmentType || undefined,
    minSalary: debouncedMinSalary ? Number(debouncedMinSalary) : undefined,
    maxSalary: debouncedMaxSalary ? Number(debouncedMaxSalary) : undefined,
    status: showInactive ? ("ALL" as const) : ("ACTIVE" as const),
  };

  // Any filter change should reset back to page 1.
  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    department,
    country,
    employmentType,
    debouncedMinSalary,
    debouncedMaxSalary,
    showInactive,
  ]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .listEmployees({ ...filters, page, pageSize: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setEmployees(res.data);
        setTotal(res.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load employees");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    department,
    country,
    employmentType,
    debouncedMinSalary,
    debouncedMaxSalary,
    showInactive,
    page,
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Employee Directory</h1>
        <div className="flex gap-2">
          <a href={api.exportUrl(filters)}>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </a>
          <Link to="/employees/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5 lg:col-span-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Name, email, or employee code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="department">Department</Label>
          <Select id="department" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="country">Country</Label>
          <Select id="country" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">All countries</option>
            {COUNTRY_CODES.map((c) => (
              <option key={c} value={c}>
                {countryName(c)}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="employmentType">Employment type</Label>
          <Select
            id="employmentType"
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value as EmploymentType | "")}
          >
            <option value="">All types</option>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="minSalary">Min salary</Label>
          <Input
            id="minSalary"
            type="number"
            min={0}
            placeholder="0"
            value={minSalary}
            onChange={(e) => setMinSalary(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="maxSalary">Max salary</Label>
          <Input
            id="maxSalary"
            type="number"
            min={0}
            placeholder="No limit"
            value={maxSalary}
            onChange={(e) => setMaxSalary(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Show inactive employees
        </label>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No employees match these filters.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {employee.employeeCode}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/employees/${employee.id}`}
                      className="font-medium hover:underline"
                    >
                      {employee.firstName} {employee.lastName}
                    </Link>
                    <div className="text-xs text-muted-foreground">{employee.email}</div>
                  </TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{countryName(employee.country)}</TableCell>
                  <TableCell>{formatEmploymentType(employee.employmentType)}</TableCell>
                  <TableCell>{formatMoney(employee.salaryAmount, employee.salaryCurrency)}</TableCell>
                  <TableCell>
                    <StatusBadge status={employee.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
