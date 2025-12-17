"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

interface CacheData {
  key: string;
  value: string | null;
  ttl: number | null;
  hit: boolean;
}

interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: string;
  url: string;
  createdAt: string;
}

interface Job {
  id: string;
  name: string;
  status: string;
  data: Record<string, unknown>;
  result: unknown;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface ServiceHealth {
  status: string;
  message?: string;
  details?: unknown;
}

export default function DemoPage() {
  // State for all sections
  const [users, setUsers] = useState<User[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cache state
  const [cacheKey, setCacheKey] = useState("demo-key");
  const [cacheValue, setCacheValue] = useState("demo-value");
  const [cacheTTL, setCacheTTL] = useState("300");
  const [cachedData, setCachedData] = useState<CacheData | null>(null);
  const [cacheStats, setCacheStats] = useState<Record<string, unknown> | null>(null);

  // File upload state
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Job queue state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobType, setJobType] = useState<"email" | "image-processing">("email");
  const [emailTo, setEmailTo] = useState("test@example.com");
  const [emailSubject, setEmailSubject] = useState("Test Email");
  const [emailBody, setEmailBody] = useState("This is a test email");

  // AI state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiModel, setAiModel] = useState("anthropic/claude-3.5-sonnet");
  const [aiStreaming, setAiStreaming] = useState(false);

  // Form validation state
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Health state
  const [healthData, setHealthData] = useState<Record<string, ServiceHealth>>({});

  useEffect(() => {
    fetchHealth();
  }, []);

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  };

  // Database functions
  const fetchUsers = async () => {
    setLoading({ ...loading, users: true });
    try {
      const res = await fetch("/api/demo/users");
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      showError("Failed to fetch users");
    } finally {
      setLoading({ ...loading, users: false });
    }
  };

  const createUser = async () => {
    if (!newUserEmail) {
      showError("Email is required");
      return;
    }
    setLoading({ ...loading, createUser: true });
    try {
      const res = await fetch("/api/demo/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newUserEmail, name: newUserName }),
      });
      if (res.ok) {
        showSuccess("User created successfully");
        setNewUserEmail("");
        setNewUserName("");
        fetchUsers();
      } else {
        const data = await res.json();
        showError(data.error || "Failed to create user");
      }
    } catch (err) {
      showError("Failed to create user");
    } finally {
      setLoading({ ...loading, createUser: false });
    }
  };

  const deleteUser = async (id: string) => {
    setLoading({ ...loading, [`deleteUser-${id}`]: true });
    try {
      const res = await fetch(`/api/demo/users?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess("User deleted successfully");
        fetchUsers();
      } else {
        showError("Failed to delete user");
      }
    } catch (err) {
      showError("Failed to delete user");
    } finally {
      setLoading({ ...loading, [`deleteUser-${id}`]: false });
    }
  };

  // Cache functions
  const setCache = async () => {
    setLoading({ ...loading, setCache: true });
    try {
      const res = await fetch("/api/demo/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: cacheKey,
          value: cacheValue,
          ttl: parseInt(cacheTTL),
        }),
      });
      if (res.ok) {
        showSuccess("Cache value set successfully");
        getCache();
      } else {
        showError("Failed to set cache");
      }
    } catch (err) {
      showError("Failed to set cache");
    } finally {
      setLoading({ ...loading, setCache: false });
    }
  };

  const getCache = async () => {
    setLoading({ ...loading, getCache: true });
    try {
      const res = await fetch(`/api/demo/cache?key=${cacheKey}`);
      const data = await res.json();
      setCachedData(data);
    } catch (err) {
      showError("Failed to get cache");
    } finally {
      setLoading({ ...loading, getCache: false });
    }
  };

  const clearCache = async () => {
    setLoading({ ...loading, clearCache: true });
    try {
      const res = await fetch(`/api/demo/cache?key=${cacheKey}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showSuccess("Cache cleared successfully");
        setCachedData(null);
      } else {
        showError("Failed to clear cache");
      }
    } catch (err) {
      showError("Failed to clear cache");
    } finally {
      setLoading({ ...loading, clearCache: false });
    }
  };

  const fetchCacheStats = async () => {
    setLoading({ ...loading, cacheStats: true });
    try {
      const res = await fetch("/api/demo/cache/stats");
      const data = await res.json();
      setCacheStats(data.stats);
    } catch (err) {
      showError("Failed to fetch cache stats");
    } finally {
      setLoading({ ...loading, cacheStats: false });
    }
  };

  // File functions
  const fetchFiles = async () => {
    setLoading({ ...loading, files: true });
    try {
      const res = await fetch("/api/demo/files");
      const data = await res.json();
      setFiles(data.files);
    } catch (err) {
      showError("Failed to fetch files");
    } finally {
      setLoading({ ...loading, files: false });
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      showError("Please select a file");
      return;
    }
    setLoading({ ...loading, upload: true });
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch("/api/demo/files", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        showSuccess("File uploaded successfully");
        setSelectedFile(null);
        fetchFiles();
      } else {
        showError("Failed to upload file");
      }
    } catch (err) {
      showError("Failed to upload file");
    } finally {
      setLoading({ ...loading, upload: false });
    }
  };

  const deleteFile = async (id: string) => {
    setLoading({ ...loading, [`deleteFile-${id}`]: true });
    try {
      const res = await fetch(`/api/demo/files?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess("File deleted successfully");
        fetchFiles();
      } else {
        showError("Failed to delete file");
      }
    } catch (err) {
      showError("Failed to delete file");
    } finally {
      setLoading({ ...loading, [`deleteFile-${id}`]: false });
    }
  };

  // Job functions
  const fetchJobs = async () => {
    setLoading({ ...loading, jobs: true });
    try {
      const res = await fetch("/api/demo/jobs");
      const data = await res.json();
      setJobs(data.jobs);
    } catch (err) {
      showError("Failed to fetch jobs");
    } finally {
      setLoading({ ...loading, jobs: false });
    }
  };

  const createJob = async () => {
    setLoading({ ...loading, createJob: true });
    try {
      const jobData =
        jobType === "email"
          ? { to: emailTo, subject: emailSubject, body: emailBody }
          : { imageUrl: "https://picsum.photos/200/300", operations: ["resize"] };

      const res = await fetch("/api/demo/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: jobType, data: jobData }),
      });
      if (res.ok) {
        showSuccess("Job created successfully");
        fetchJobs();
      } else {
        showError("Failed to create job");
      }
    } catch (err) {
      showError("Failed to create job");
    } finally {
      setLoading({ ...loading, createJob: false });
    }
  };

  // AI functions
  const sendAIMessage = async () => {
    if (!aiPrompt) {
      showError("Please enter a prompt");
      return;
    }
    setAiStreaming(true);
    setAiResponse("");
    try {
      const res = await fetch("/api/demo/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, model: aiModel }),
      });

      if (!res.ok) {
        const data = await res.json();
        showError(data.error || "Failed to get AI response");
        setAiStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        showError("Failed to read response");
        setAiStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullResponse += chunk;
        setAiResponse(fullResponse);
      }
    } catch (err) {
      showError("Failed to get AI response");
    } finally {
      setAiStreaming(false);
    }
  };

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formEmail) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formEmail)) {
      errors.email = "Email is invalid";
    }

    if (!formPassword) {
      errors.password = "Password is required";
    } else if (formPassword.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitForm = () => {
    if (validateForm()) {
      showSuccess("Form validation passed! Data: " + JSON.stringify({ formEmail }));
      setFormEmail("");
      setFormPassword("");
      setFormErrors({});
    }
  };

  // Health check
  const fetchHealth = async () => {
    setLoading({ ...loading, health: true });
    try {
      const res = await fetch("/api/demo/health");
      const data = await res.json();
      setHealthData(data.services);
    } catch (err) {
      showError("Failed to fetch health status");
    } finally {
      setLoading({ ...loading, health: false });
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "healthy") return <Badge variant="success">Healthy</Badge>;
    if (status === "unhealthy") return <Badge variant="destructive">Unhealthy</Badge>;
    return <Badge variant="warning">Unknown</Badge>;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Technology Demo Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive demonstration of all integrated technologies
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-4">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="database" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="cache">Redis</TabsTrigger>
          <TabsTrigger value="storage">MinIO</TabsTrigger>
          <TabsTrigger value="queue">BullMQ</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        {/* Database Tab */}
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>PostgreSQL + Drizzle ORM</CardTitle>
              <CardDescription>Test database operations with Drizzle ORM</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createUser} disabled={loading.createUser}>
                  {loading.createUser ? "Creating..." : "Create User"}
                </Button>
                <Button variant="outline" onClick={fetchUsers} disabled={loading.users}>
                  {loading.users ? "Loading..." : "Refresh Users"}
                </Button>
              </div>

              <div className="border rounded-lg p-4 mt-4" data-testid="users-panel">
                <h3 className="font-semibold mb-3">Users ({users.length})</h3>
                <div className="space-y-2">
                  {users.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No users found. Create one above!
                    </p>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 border rounded"
                        data-testid={`user-row-${user.email}`}
                      >
                        <div>
                          <p className="font-medium" data-testid="user-email">
                            {user.email}
                          </p>
                          {user.name && (
                            <p className="text-sm text-muted-foreground">{user.name}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(user.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                          disabled={loading[`deleteUser-${user.id}`]}
                        >
                          Delete
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cache Tab */}
        <TabsContent value="cache">
          <Card>
            <CardHeader>
              <CardTitle>Redis Cache</CardTitle>
              <CardDescription>Test Redis caching operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cacheKey">Cache Key</Label>
                <Input
                  id="cacheKey"
                  placeholder="my-key"
                  value={cacheKey}
                  onChange={(e) => setCacheKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cacheValue">Cache Value</Label>
                <Input
                  id="cacheValue"
                  placeholder="my-value"
                  value={cacheValue}
                  onChange={(e) => setCacheValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cacheTTL">TTL (seconds)</Label>
                <Input
                  id="cacheTTL"
                  type="number"
                  placeholder="300"
                  value={cacheTTL}
                  onChange={(e) => setCacheTTL(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={setCache} disabled={loading.setCache}>
                  {loading.setCache ? "Setting..." : "Set Cache"}
                </Button>
                <Button variant="outline" onClick={getCache} disabled={loading.getCache}>
                  {loading.getCache ? "Getting..." : "Get Cache"}
                </Button>
                <Button variant="destructive" onClick={clearCache} disabled={loading.clearCache}>
                  Clear Cache
                </Button>
                <Button variant="secondary" onClick={fetchCacheStats} disabled={loading.cacheStats}>
                  Get Stats
                </Button>
              </div>

              {cachedData && (
                <div className="border rounded-lg p-4 mt-4" data-testid="cache-result-panel">
                  <h3 className="font-semibold mb-2">Cache Result</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      {cachedData.hit ? (
                        <Badge variant="success" data-testid="cache-hit">
                          Hit
                        </Badge>
                      ) : (
                        <Badge variant="warning" data-testid="cache-miss">
                          Miss
                        </Badge>
                      )}
                    </p>
                    <p>
                      <span className="font-medium">Key:</span>{" "}
                      <span data-testid="cache-key">{cachedData.key}</span>
                    </p>
                    <p>
                      <span className="font-medium">Value:</span>{" "}
                      <span data-testid="cache-value">{cachedData.value || "null"}</span>
                    </p>
                    {cachedData.ttl && (
                      <p>
                        <span className="font-medium">TTL:</span> {cachedData.ttl}s
                      </p>
                    )}
                  </div>
                </div>
              )}

              {cacheStats && (
                <div className="border rounded-lg p-4 mt-4">
                  <h3 className="font-semibold mb-2">Cache Statistics</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(cacheStats).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>MinIO Object Storage</CardTitle>
              <CardDescription>Upload and manage files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={uploadFile} disabled={loading.upload || !selectedFile}>
                  {loading.upload ? "Uploading..." : "Upload File"}
                </Button>
                <Button variant="outline" onClick={fetchFiles} disabled={loading.files}>
                  {loading.files ? "Loading..." : "Refresh Files"}
                </Button>
              </div>

              <div className="border rounded-lg p-4 mt-4" data-testid="files-panel">
                <h3 className="font-semibold mb-3">Uploaded Files ({files.length})</h3>
                <div className="space-y-2">
                  {files.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No files uploaded yet</p>
                  ) : (
                    files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 border rounded"
                        data-testid={`file-row-${file.originalName}`}
                      >
                        <div>
                          <p className="font-medium" data-testid="file-name">
                            {file.originalName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {file.mimeType} • {(parseInt(file.size) / 1024).toFixed(2)} KB
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(file.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(file.url, "_blank")}
                          >
                            View
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteFile(file.id)}
                            disabled={loading[`deleteFile-${file.id}`]}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue Tab */}
        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>BullMQ Job Queue</CardTitle>
              <CardDescription>Create and monitor background jobs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Job Type</Label>
                <div className="flex gap-2">
                  <Button
                    variant={jobType === "email" ? "default" : "outline"}
                    onClick={() => setJobType("email")}
                  >
                    Email Job
                  </Button>
                  <Button
                    variant={jobType === "image-processing" ? "default" : "outline"}
                    onClick={() => setJobType("image-processing")}
                  >
                    Image Processing
                  </Button>
                </div>
              </div>

              {jobType === "email" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="emailTo">To</Label>
                    <Input
                      id="emailTo"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailSubject">Subject</Label>
                    <Input
                      id="emailSubject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailBody">Body</Label>
                    <Textarea
                      id="emailBody"
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button onClick={createJob} disabled={loading.createJob}>
                  {loading.createJob ? "Creating..." : "Create Job"}
                </Button>
                <Button variant="outline" onClick={fetchJobs} disabled={loading.jobs}>
                  {loading.jobs ? "Loading..." : "Refresh Jobs"}
                </Button>
              </div>

              <div className="border rounded-lg p-4 mt-4">
                <h3 className="font-semibold mb-3">Jobs ({jobs.length})</h3>
                <div className="space-y-2">
                  {jobs.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No jobs found. Create one above!
                    </p>
                  ) : (
                    jobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{job.name}</p>
                            <Badge
                              variant={
                                job.status === "completed"
                                  ? "success"
                                  : job.status === "failed"
                                    ? "destructive"
                                    : "warning"
                              }
                            >
                              {job.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created: {new Date(job.createdAt).toLocaleString()}
                          </p>
                          {job.error && (
                            <p className="text-xs text-red-500 mt-1">Error: {job.error}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Tab */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI Integration (OpenRouter)</CardTitle>
              <CardDescription>Test AI text generation with streaming</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aiModel">Model</Label>
                <select
                  id="aiModel"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                >
                  <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="openai/gpt-4o">GPT-4o</option>
                  <option value="meta-llama/llama-3-70b-instruct">Llama 3 70B</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="aiPrompt">Prompt</Label>
                <Textarea
                  id="aiPrompt"
                  placeholder="Enter your prompt here..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                />
              </div>
              <Button onClick={sendAIMessage} disabled={aiStreaming || !aiPrompt}>
                {aiStreaming ? "Generating..." : "Send Message"}
              </Button>

              {aiResponse && (
                <div className="border rounded-lg p-4 mt-4">
                  <h3 className="font-semibold mb-2">Response</h3>
                  <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation">
          <Card>
            <CardHeader>
              <CardTitle>Form Validation (Zod)</CardTitle>
              <CardDescription>Test client-side validation with Zod</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="formEmail">Email</Label>
                <Input
                  id="formEmail"
                  type="email"
                  placeholder="user@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
                {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="formPassword">Password</Label>
                <Input
                  id="formPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                />
                {formErrors.password && (
                  <p className="text-sm text-red-500">{formErrors.password}</p>
                )}
              </div>
              <Button onClick={submitForm}>Validate Form</Button>

              <Alert>
                <AlertTitle>Validation Rules</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                    <li>Email must be a valid email format</li>
                    <li>Password must be at least 8 characters</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle>Service Health Status</CardTitle>
              <CardDescription>Real-time health monitoring of all services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={fetchHealth} disabled={loading.health} variant="outline">
                {loading.health ? "Checking..." : "Refresh Status"}
              </Button>

              <div className="grid gap-4">
                {Object.entries(healthData).map(([service, health]) => (
                  <div key={service} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold capitalize">{service}</h3>
                      {getStatusBadge(health.status)}
                    </div>
                    {health.message && (
                      <p className="text-sm text-muted-foreground">{health.message}</p>
                    )}
                    {health.details && (
                      <pre className="text-xs mt-2 p-2 bg-muted rounded">
                        {JSON.stringify(health.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>Queue Monitoring Dashboard</CardTitle>
              <CardDescription>Monitor BullMQ job queues with Bull Board interface</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <h3 className="font-semibold mb-2">Bull Board Dashboard</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Access the full Bull Board monitoring dashboard to view detailed information about
                  all job queues, inspect individual jobs, retry failed jobs, and manage queue
                  operations.
                </p>
                <div className="flex gap-2">
                  <Button asChild>
                    <a href="/api/bull-board" target="_blank" rel="noopener noreferrer">
                      Open Bull Board
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/monitoring" rel="noopener noreferrer">
                      Monitoring Dashboard
                    </a>
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Features</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">✓</div>
                      <div>
                        <p className="font-medium">Real-time Monitoring</p>
                        <p className="text-muted-foreground">
                          Live updates on job status and queue statistics
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">✓</div>
                      <div>
                        <p className="font-medium">Job Inspection</p>
                        <p className="text-muted-foreground">
                          View detailed job data, progress, and results
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">✓</div>
                      <div>
                        <p className="font-medium">Retry Failed Jobs</p>
                        <p className="text-muted-foreground">
                          Manually retry jobs that failed processing
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">✓</div>
                      <div>
                        <p className="font-medium">Queue Management</p>
                        <p className="text-muted-foreground">Pause, resume, and clean queues</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">✓</div>
                      <div>
                        <p className="font-medium">Search & Filter</p>
                        <p className="text-muted-foreground">Find specific jobs quickly</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">✓</div>
                      <div>
                        <p className="font-medium">Multi-Queue Support</p>
                        <p className="text-muted-foreground">
                          Monitor all queues from one interface
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Available Queues</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <p className="font-medium">Email Queue</p>
                      <p className="text-sm text-muted-foreground">Handles email sending jobs</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <a href="/api/bull-board/queues/email" target="_blank">
                        View
                      </a>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <p className="font-medium">Image Processing Queue</p>
                      <p className="text-sm text-muted-foreground">Handles image processing jobs</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <a href="/api/bull-board/queues/image-processing" target="_blank">
                        View
                      </a>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <p className="font-medium">Generic Jobs Queue</p>
                      <p className="text-sm text-muted-foreground">
                        Handles miscellaneous background jobs
                      </p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <a href="/api/bull-board/queues/jobs" target="_blank">
                        View
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTitle>Quick Tip</AlertTitle>
                <AlertDescription>
                  Create some jobs in the BullMQ tab above, then visit the monitoring dashboard to
                  see them in action! Bull Board provides a comprehensive view of all job activity.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
