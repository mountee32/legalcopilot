import { DashboardSkeleton } from "@/components/dashboard";

export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <DashboardSkeleton />
      </div>
    </div>
  );
}
