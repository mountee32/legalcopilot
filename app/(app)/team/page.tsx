import { UsersRound } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function TeamPage() {
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Team</h1>
      <EmptyState
        icon={UsersRound}
        title="No team members yet"
        description="Invite colleagues to collaborate on cases and share workload."
      />
    </div>
  );
}
