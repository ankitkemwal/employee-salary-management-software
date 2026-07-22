import { useState, type FormEvent } from "react";
import { api, ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface AddSalaryRecordFormProps {
  employeeId: string;
  defaultCurrency: string;
  onSuccess: () => void;
}

export function AddSalaryRecordForm({
  employeeId,
  defaultCurrency,
  onSuccess,
}: AddSalaryRecordFormProps) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.addSalaryRecord(employeeId, {
        amount: Number(amount),
        currency,
        effectiveDate,
        reason: reason || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : "Failed to add salary record");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min={0}
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              required
              maxLength={3}
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="effectiveDate">Effective date</Label>
            <Input
              id="effectiveDate"
              type="date"
              required
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              placeholder="Annual Review 2025"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {error && <p className="sm:col-span-4 text-sm text-destructive">{error}</p>}

          <div className="sm:col-span-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save salary record"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
