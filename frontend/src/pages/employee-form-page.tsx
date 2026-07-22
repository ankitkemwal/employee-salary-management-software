import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, ApiError } from "@/api/client";
import type { EmployeeStatus, EmploymentType } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { DEPARTMENTS, COUNTRY_CODES, countryName, EMPLOYMENT_TYPES } from "@/lib/constants";

interface EmployeeFormPageProps {
  mode: "create" | "edit";
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  jobTitle: string;
  country: string;
  employmentType: EmploymentType | "";
  hireDate: string;
  status: EmployeeStatus;
  salaryAmount: string;
  salaryCurrency: string;
}

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  department: "",
  jobTitle: "",
  country: "",
  employmentType: "",
  hireDate: "",
  status: "ACTIVE",
  salaryAmount: "",
  salaryCurrency: "USD",
};

export function EmployeeFormPage({ mode }: EmployeeFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    api
      .getEmployee(id)
      .then((employee) => {
        setForm({
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          department: employee.department,
          jobTitle: employee.jobTitle,
          country: employee.country,
          employmentType: employee.employmentType,
          hireDate: employee.hireDate,
          status: employee.status,
          salaryAmount: "",
          salaryCurrency: employee.salaryCurrency ?? "USD",
        });
      })
      .catch((err) => setError(err instanceof ApiError ? err.body.message : "Failed to load employee"))
      .finally(() => setLoading(false));
  }, [mode, id]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (mode === "create") {
        const created = await api.createEmployee({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          department: form.department,
          jobTitle: form.jobTitle,
          country: form.country,
          employmentType: form.employmentType as EmploymentType,
          hireDate: form.hireDate,
          salary: {
            amount: Number(form.salaryAmount),
            currency: form.salaryCurrency,
          },
        });
        navigate(`/employees/${created.id}`);
      } else if (id) {
        await api.updateEmployee(id, {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          department: form.department,
          jobTitle: form.jobTitle,
          country: form.country,
          employmentType: form.employmentType as EmploymentType,
          hireDate: form.hireDate,
          status: form.status,
        });
        navigate(`/employees/${id}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : "Failed to save employee");
      setSubmitting(false);
    }
  }

  const backTo = mode === "edit" && id ? `/employees/${id}` : "/";

  if (loading) {
    return <p className="py-8 text-center text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Link to={backTo} className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="text-xl font-semibold">
        {mode === "create" ? "Add Employee" : "Edit Employee"}
      </h1>

      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                required
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                required
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="department">Department</Label>
              <Select
                id="department"
                required
                value={form.department}
                onChange={(e) => update("department", e.target.value)}
              >
                <option value="" disabled>
                  Select department
                </option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input
                id="jobTitle"
                required
                value={form.jobTitle}
                onChange={(e) => update("jobTitle", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country">Country</Label>
              <Select
                id="country"
                required
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
              >
                <option value="" disabled>
                  Select country
                </option>
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
                required
                value={form.employmentType}
                onChange={(e) => update("employmentType", e.target.value as EmploymentType)}
              >
                <option value="" disabled>
                  Select type
                </option>
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hireDate">Hire date</Label>
              <Input
                id="hireDate"
                type="date"
                required
                value={form.hireDate}
                onChange={(e) => update("hireDate", e.target.value)}
              />
            </div>

            {mode === "edit" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  value={form.status}
                  onChange={(e) => update("status", e.target.value as EmployeeStatus)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </div>
            )}

            {mode === "create" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="salaryAmount">Initial salary amount</Label>
                  <Input
                    id="salaryAmount"
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={form.salaryAmount}
                    onChange={(e) => update("salaryAmount", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="salaryCurrency">Currency</Label>
                  <Input
                    id="salaryCurrency"
                    required
                    maxLength={3}
                    value={form.salaryCurrency}
                    onChange={(e) => update("salaryCurrency", e.target.value.toUpperCase())}
                  />
                </div>
              </>
            )}

            {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}

            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : mode === "create" ? "Create employee" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
