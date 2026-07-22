import { Badge } from "@/components/ui/badge";
import type { EmployeeStatus } from "@/api/types";

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <Badge variant={status === "ACTIVE" ? "success" : "secondary"}>
      {status === "ACTIVE" ? "Active" : "Inactive"}
    </Badge>
  );
}
