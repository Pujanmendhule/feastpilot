import { Badge } from "@/components/ui/badge";

type SessionStatusBadgeProps = {
  status: string;
};

export function SessionStatusBadge({ status }: SessionStatusBadgeProps) {
  return <Badge variant="outline">{status}</Badge>;
}
