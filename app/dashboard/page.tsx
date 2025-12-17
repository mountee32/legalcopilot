"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Database,
  Upload,
  Cpu,
  MessageSquare,
  Activity,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

export default function Dashboard() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [jobStatus, setJobStatus] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string>("");

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealthStatus(data);
    } catch (error) {
      console.error("Health check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const testUpload = async () => {
    setUploadStatus("Uploading...");
    try {
      // Create a test file
      const blob = new Blob(["Hello, MinIO!"], { type: "text/plain" });
      const file = new File([blob], "test.txt", { type: "text/plain" });

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setUploadStatus(data.success ? `✅ Uploaded: ${data.upload.url}` : "❌ Upload failed");
    } catch (error) {
      setUploadStatus("❌ Upload failed");
    }
  };

  const testJob = async () => {
    setJobStatus("Creating job...");
    try {
      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "email",
          data: {
            to: "test@example.com",
            subject: "Test Email",
            body: "This is a test email from BullMQ",
          },
        }),
      });

      const data = await res.json();
      setJobStatus(data.success ? `✅ Job created: ${data.job.id}` : "❌ Job creation failed");
    } catch (error) {
      setJobStatus("❌ Job creation failed");
    }
  };

  const testAI = async () => {
    setAiResponse("Thinking...");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Say hello in one sentence!",
        }),
      });

      if (!res.ok) {
        setAiResponse("❌ AI request failed - check if OPENROUTER_API_KEY is set");
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let text = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value);
        }
        setAiResponse(`✅ ${text}`);
      }
    } catch (error) {
      setAiResponse("❌ AI request failed");
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Test all integrated services</p>
        </div>

        {/* Health Check Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Service Health
            </CardTitle>
            <CardDescription>Check the status of all services</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={checkHealth} disabled={loading} className="mb-4">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Check Health
            </Button>

            {healthStatus && (
              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2">
                  {healthStatus.services.postgres ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span>PostgreSQL: {healthStatus.details.postgres}</span>
                </div>
                <div className="flex items-center gap-2">
                  {healthStatus.services.redis ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span>Redis: {healthStatus.details.redis}</span>
                </div>
                <div className="flex items-center gap-2">
                  {healthStatus.services.minio ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span>MinIO: {healthStatus.details.minio}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* File Upload Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                MinIO Storage
              </CardTitle>
              <CardDescription>Test file upload to MinIO</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={testUpload} className="mb-2">
                Test Upload
              </Button>
              {uploadStatus && <p className="text-sm mt-2">{uploadStatus}</p>}
            </CardContent>
          </Card>

          {/* Job Queue Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                BullMQ Jobs
              </CardTitle>
              <CardDescription>Test job queue creation</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={testJob} className="mb-2">
                Create Test Job
              </Button>
              {jobStatus && <p className="text-sm mt-2">{jobStatus}</p>}
            </CardContent>
          </Card>

          {/* AI Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                AI Integration
              </CardTitle>
              <CardDescription>Test OpenRouter AI integration</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={testAI} className="mb-2">
                Test AI
              </Button>
              {aiResponse && <p className="text-sm mt-2">{aiResponse}</p>}
            </CardContent>
          </Card>

          {/* Database Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database
              </CardTitle>
              <CardDescription>Drizzle ORM with PostgreSQL</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Run migrations:{" "}
                <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">npm run db:push</code>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Access service UIs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <strong>MinIO Console:</strong>{" "}
              <a
                href="http://localhost:9001"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                http://localhost:9001
              </a>
            </p>
            <p>
              <strong>Dozzle Logs:</strong>{" "}
              <a
                href="http://localhost:8080"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                http://localhost:8080
              </a>
            </p>
            <p>
              <strong>Drizzle Studio:</strong> Run{" "}
              <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">npm run db:studio</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
