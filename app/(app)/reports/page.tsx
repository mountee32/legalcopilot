import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function ReportsPage() {
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Reports</h1>
      <EmptyState
        icon={BarChart3}
        title="No reports available"
        description="Reports will be generated once you have data in the system."
      />
    </div>
  );
}
