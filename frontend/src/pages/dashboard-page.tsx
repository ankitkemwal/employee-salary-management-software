import { useEffect, useState } from "react";
import { api, ApiError } from "@/api/client";
import type { DashboardStats } from "@/api/types";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HorizontalBarList } from "@/components/horizontal-bar-list";
import { countryName } from "@/lib/constants";
import { formatMoney } from "@/lib/format";

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getDashboardStats()
      .then(setStats)
      .catch((err) => setError(err instanceof ApiError ? err.body.message : "Failed to load stats"));
  }, []);

  if (error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!stats) {
    return <p className="py-8 text-center text-muted-foreground">Loading…</p>;
  }

  const byDepartment = [...stats.byDepartment].sort((a, b) => b.headcount - a.headcount);
  const byCountry = [...stats.byCountry].sort((a, b) => b.headcount - a.headcount);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Active headcount" value={stats.activeHeadcount.toLocaleString()} />
        <StatTile label="Currencies in payroll" value={String(stats.byCurrency.length)} />
        <StatTile label="Countries represented" value={String(stats.byCountry.length)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll by currency</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-muted-foreground">
            Totals are never summed across currencies — each row stands on its own.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Currency</TableHead>
                <TableHead>Headcount</TableHead>
                <TableHead>Total payroll</TableHead>
                <TableHead>Average salary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.byCurrency.map((row) => (
                <TableRow key={row.currency}>
                  <TableCell className="font-medium">{row.currency}</TableCell>
                  <TableCell>{row.headcount.toLocaleString()}</TableCell>
                  <TableCell>{formatMoney(row.totalPayroll, row.currency)}</TableCell>
                  <TableCell>{formatMoney(Math.round(row.avgSalary), row.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Headcount by department</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarList
              items={byDepartment.map((d) => ({ label: d.department, value: d.headcount }))}
              valueFormatter={(v) => v.toLocaleString()}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Headcount by country</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarList
              items={byCountry.map((c) => ({ label: countryName(c.country), value: c.headcount }))}
              valueFormatter={(v) => v.toLocaleString()}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
