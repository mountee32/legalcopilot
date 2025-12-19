import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">Settings</h1>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Firm Settings
              </CardTitle>
              <CardDescription>
                Configure your firm&apos;s preferences and integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Settings configuration coming soon.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
