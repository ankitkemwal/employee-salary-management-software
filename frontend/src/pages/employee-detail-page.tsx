import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, ApiError } from "@/api/client";
import type { Employee, SalaryRecord } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { AddSalaryRecordForm } from "@/components/add-salary-record-form";
import { countryName } from "@/lib/constants";
import { formatDate, formatEmploymentType, formatMoney } from "@/lib/format";

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [history, setHistory] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddSalary, setShowAddSalary] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [employeeRes, historyRes] = await Promise.all([
        api.getEmployee(id),
        api.getSalaryHistory(id),
      ]);
      setEmployee(employeeRes);
      setHistory(historyRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : "Failed to load employee");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDeactivate() {
    if (!employee) return;
    if (!confirm(`Mark ${employee.firstName} ${employee.lastName} as inactive?`)) return;
    setDeactivating(true);
    try {
      await api.deactivateEmployee(employee.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : "Failed to deactivate employee");
    } finally {
      setDeactivating(false);
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-muted-foreground">Loading…</p>;
  }

  if (error && !employee) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to directory
        </Link>
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="flex flex-col gap-4">
      <Link to="/" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to directory
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {employee.employeeCode} · {employee.jobTitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={employee.status} />
          <Link to={`/employees/${employee.id}/edit`}>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </Link>
          {employee.status === "ACTIVE" && (
            <Button variant="destructive" size="sm" onClick={handleDeactivate} disabled={deactivating}>
              {deactivating ? "Deactivating…" : "Deactivate"}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Department</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-medium">{employee.department}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Country</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-medium">{countryName(employee.country)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Employment type</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-medium">
            {formatEmploymentType(employee.employmentType)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current salary</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-medium">
            {formatMoney(employee.salaryAmount, employee.salaryCurrency)}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Email</CardTitle>
          </CardHeader>
          <CardContent>{employee.email}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hire date</CardTitle>
          </CardHeader>
          <CardContent>{formatDate(employee.hireDate)}</CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Salary history</h2>
        <Button size="sm" variant="outline" onClick={() => setShowAddSalary((v) => !v)}>
          {showAddSalary ? "Cancel" : "Add salary record"}
        </Button>
      </div>

      {showAddSalary && (
        <AddSalaryRecordForm
          employeeId={employee.id}
          defaultCurrency={employee.salaryCurrency ?? "USD"}
          onSuccess={() => {
            setShowAddSalary(false);
            load();
          }}
        />
      )}

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Effective date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Recorded by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No salary records yet.
                </TableCell>
              </TableRow>
            ) : (
              history.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(record.effectiveDate)}</TableCell>
                  <TableCell>{formatMoney(record.amount, record.currency)}</TableCell>
                  <TableCell>{record.reason ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{record.createdBy}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
