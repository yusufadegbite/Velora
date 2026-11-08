import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

export default function AdminNotFound() {
  return <EmptyState icon={SearchX} title="We couldn't find that" description="It may have been removed, or it belongs to a different account." action={<LinkButton href="/admin" variant="dark">Back to admin</LinkButton>} />;
}
