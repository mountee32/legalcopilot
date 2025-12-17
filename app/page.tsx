import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Lock, Cloud, Activity, Cpu, Mail, CreditCard, CheckCircle } from "lucide-react";

export default function Home() {
  const services = [
    { name: "PostgreSQL", icon: Database, status: "Ready", color: "text-blue-500" },
    { name: "Redis", icon: Activity, status: "Ready", color: "text-red-500" },
    { name: "MinIO", icon: Cloud, status: "Ready", color: "text-orange-500" },
    { name: "Better Auth", icon: Lock, status: "Configured", color: "text-green-500" },
    { name: "BullMQ", icon: Cpu, status: "Ready", color: "text-purple-500" },
  ];

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Template Project
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Production-ready full-stack template with modern technologies
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {services.map((service) => (
            <Card key={service.name} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <service.icon className={`w-6 h-6 ${service.color}`} />
                  {service.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{service.status}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Tech Stack</CardTitle>
            <CardDescription>Everything you need to build modern applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Frontend</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Next.js 15 • React 19 • TypeScript • shadcn/ui • Tailwind CSS
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Backend & Data</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                PostgreSQL • Drizzle ORM • Redis • BullMQ • MinIO
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">AI & Tools</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vercel AI SDK • OpenRouter • Zod • Better Auth • Sentry
              </p>
            </div>
            <div className="pt-4">
              <Button asChild className="w-full">
                <Link href="/dashboard">Get Started</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
