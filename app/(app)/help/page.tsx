import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Book, MessageCircle, Mail } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Help & Support</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Documentation
            </CardTitle>
            <CardDescription>Learn how to use Legal Copilot effectively</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Documentation coming soon.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              FAQs
            </CardTitle>
            <CardDescription>Answers to commonly asked questions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">FAQs coming soon.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Live Chat
            </CardTitle>
            <CardDescription>Chat with our support team</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Live chat coming soon.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Support
            </CardTitle>
            <CardDescription>Get help via email</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Contact us at support@legalcopilot.co.uk
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
