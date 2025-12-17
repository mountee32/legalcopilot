"use client";

import { useState, useEffect, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

interface QueueInfo {
  name: string;
  counts: QueueStats;
}

interface QueueData {
  email: QueueInfo;
  image: QueueInfo;
  jobs: QueueInfo;
}

export default function MonitoringPage() {
  type BadgeVariant = ComponentProps<typeof Badge>["variant"];

  const [queueStats, setQueueStats] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQueueStats();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchQueueStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueueStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/jobs");
      const data = await res.json();
      if (data.queueStats) {
        // Transform the data to match our interface
        const transformed: QueueData = {
          email: {
            name: "email",
            counts: data.queueStats.email,
          },
          image: {
            name: "image-processing",
            counts: data.queueStats.image,
          },
          jobs: {
            name: "jobs",
            counts: data.queueStats.email, // Fallback
          },
        };
        setQueueStats(transformed);
      }
      setError(null);
    } catch (err) {
      setError("Failed to fetch queue statistics");
      console.error("Error fetching queue stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalJobs = (stats: QueueStats) => {
    return (
      stats.waiting + stats.active + stats.completed + stats.failed + stats.delayed + stats.paused
    );
  };

  const getHealthStatus = (stats: QueueStats): { status: string; color: BadgeVariant } => {
    const failureRate = stats.failed / Math.max(1, getTotalJobs(stats));
    if (failureRate > 0.5) return { status: "unhealthy", color: "destructive" };
    if (failureRate > 0.2) return { status: "warning", color: "warning" };
    if (stats.active > 0) return { status: "processing", color: "default" };
    if (stats.waiting > 0) return { status: "active", color: "success" };
    return { status: "idle", color: "secondary" };
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Queue Monitoring Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time monitoring of BullMQ job queues with Bull Board
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 mb-6">
        {/* Queue Statistics Cards */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Queue Statistics</CardTitle>
                <CardDescription>Overview of all job queues</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchQueueStats} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {queueStats ? (
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(queueStats).map(([key, queue]) => {
                  const health = getHealthStatus(queue.counts);
                  return (
                    <Card key={key}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg capitalize">{queue.name}</CardTitle>
                          <Badge variant={health.color}>{health.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Waiting:</span>
                            <span className="font-medium">{queue.counts.waiting}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Active:</span>
                            <span className="font-medium text-blue-600">{queue.counts.active}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Completed:</span>
                            <span className="font-medium text-green-600">
                              {queue.counts.completed}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Failed:</span>
                            <span className="font-medium text-red-600">{queue.counts.failed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Delayed:</span>
                            <span className="font-medium">{queue.counts.delayed}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2 mt-2">
                            <span className="font-medium">Total Jobs:</span>
                            <span className="font-bold">{getTotalJobs(queue.counts)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {loading ? "Loading queue statistics..." : "No queue data available"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bull Board UI Card */}
        <Card>
          <CardHeader>
            <CardTitle>Bull Board UI</CardTitle>
            <CardDescription>
              Advanced queue management interface with job details and controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <h3 className="font-semibold mb-2">Access Bull Board</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Bull Board provides a detailed view of all jobs, including the ability to retry
                  failed jobs, inspect job data, and manage queue settings.
                </p>
                <div className="flex gap-2">
                  <Button asChild>
                    <a href="/api/bull-board" target="_blank" rel="noopener noreferrer">
                      Open Bull Board Dashboard
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/demo" rel="noopener noreferrer">
                      Go to Demo Page
                    </a>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Features:</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>View all jobs across multiple queues</li>
                  <li>Inspect job data, progress, and results</li>
                  <li>Retry failed jobs manually</li>
                  <li>Clean completed or failed jobs</li>
                  <li>Pause and resume queues</li>
                  <li>Real-time updates on job status</li>
                  <li>Search and filter jobs</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common queue management operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              <Button variant="outline" asChild>
                <a href="/api/bull-board/queues/email" target="_blank">
                  View Email Queue
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/api/bull-board/queues/image-processing" target="_blank">
                  View Image Queue
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/api/bull-board/queues/jobs" target="_blank">
                  View Jobs Queue
                </a>
              </Button>
              <Button variant="outline" onClick={fetchQueueStats}>
                Refresh Statistics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertTitle>About Bull Board</AlertTitle>
        <AlertDescription>
          Bull Board is a monitoring dashboard for BullMQ queues. It provides a web interface to
          view and manage your background jobs. The dashboard automatically refreshes every 5
          seconds to show real-time queue statistics.
        </AlertDescription>
      </Alert>
    </div>
  );
}
