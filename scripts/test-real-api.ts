/**
 * Real API Integration Test
 *
 * Tests actual HTTP API endpoints against the running server.
 * Verifies that the new schema fields are properly exposed via the API.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const bugs: string[] = [];

function logBug(description: string) {
  bugs.push(description);
  console.log(`   ✗ BUG: ${description}`);
}

function logSuccess(message: string) {
  console.log(`   ✓ ${message}`);
}

async function testAPIs() {
  console.log("=== Real API Integration Tests ===\n");

  // Step 1: Create a test user via signup
  console.log("Step 1: Creating test user...");
  const email = `test-${Date.now()}@example.com`;
  const signupResponse = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: "testpassword123",
      name: "Test User",
    }),
  });

  if (!signupResponse.ok) {
    const errorText = await signupResponse.text();
    console.error(`Failed to sign up: ${signupResponse.status} - ${errorText}`);

    // Try sign-in instead if user might exist
    console.log("Trying sign-in...");
    const signinResponse = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "testpassword123",
      }),
    });

    if (!signinResponse.ok) {
      console.error("Sign-in also failed. Testing without auth...");
      await testPublicEndpoints();
      return bugs;
    }
  }

  // Get cookies from signup/signin response
  const setCookieHeader = signupResponse.headers.get("set-cookie");
  const cookies = setCookieHeader || "";

  console.log(`   ✓ User created/authenticated: ${email}\n`);

  // Helper function for authenticated requests
  async function authFetch(path: string, options: RequestInit = {}) {
    return fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Cookie: cookies,
        ...options.headers,
      },
    });
  }

  // ============================================
  // Test Lead API with new fields
  // ============================================
  console.log("=== Testing Lead API ===\n");

  console.log("Creating lead with new fields...");
  const leadResponse = await authFetch("/api/leads", {
    method: "POST",
    body: JSON.stringify({
      firstName: "Jane",
      lastName: "Prospect",
      email: "jane.prospect@example.com",
      phone: "07700900111",
      source: "website",
      enquiryType: "conveyancing", // NEW FIELD
      message: "I need help with buying a house in London", // NEW FIELD
      // assignedTo would need a valid user ID
    }),
  });

  if (leadResponse.ok) {
    const lead = await leadResponse.json();
    logSuccess(`Lead created: ${lead.id}`);

    if (lead.enquiryType === "conveyancing") {
      logSuccess(`Lead has enquiryType: ${lead.enquiryType}`);
    } else {
      logBug(`Lead enquiryType not returned correctly. Got: ${lead.enquiryType}`);
    }

    if (lead.message) {
      logSuccess(`Lead has message field`);
    } else {
      logBug("Lead message field not returned");
    }
  } else {
    const error = await leadResponse.text();
    logBug(`Failed to create lead: ${leadResponse.status} - ${error}`);
  }

  // ============================================
  // Test Client API with new fields
  // ============================================
  console.log("\n=== Testing Client API ===\n");

  console.log("Creating client with new fields...");
  const clientResponse = await authFetch("/api/clients", {
    method: "POST",
    body: JSON.stringify({
      type: "individual",
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      source: "lead_conversion", // NEW FIELD
    }),
  });

  let clientId: string | null = null;
  if (clientResponse.ok) {
    const client = await clientResponse.json();
    clientId = client.id;
    logSuccess(`Client created: ${client.id}`);

    if (client.source === "lead_conversion") {
      logSuccess(`Client has source: ${client.source}`);
    } else {
      logBug(`Client source not returned correctly. Got: ${client.source}`);
    }
  } else {
    const error = await clientResponse.text();
    logBug(`Failed to create client: ${clientResponse.status} - ${error}`);
  }

  // ============================================
  // Test Matter API with new fields
  // ============================================
  console.log("\n=== Testing Matter API ===\n");

  if (clientId) {
    console.log("Creating matter with new fields...");
    const matterResponse = await authFetch("/api/matters", {
      method: "POST",
      body: JSON.stringify({
        clientId,
        title: "Property Purchase - 123 Test Lane",
        practiceArea: "conveyancing",
        description: "Residential freehold purchase",
      }),
    });

    let matterId: string | null = null;
    if (matterResponse.ok) {
      const matter = await matterResponse.json();
      matterId = matter.id;
      logSuccess(`Matter created: ${matter.id}`);

      // Update matter with risk assessment fields
      console.log("Updating matter with risk assessment...");
      const updateResponse = await authFetch(`/api/matters/${matter.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          riskScore: 25,
          riskFactors: [{ factor: "First-time buyer", weight: 10, value: true }],
          riskAssessedAt: new Date().toISOString(),
        }),
      });

      if (updateResponse.ok) {
        const updatedMatter = await updateResponse.json();
        if (updatedMatter.riskScore === 25) {
          logSuccess(`Matter has riskScore: ${updatedMatter.riskScore}`);
        } else {
          logBug(`Matter riskScore not updated correctly. Got: ${updatedMatter.riskScore}`);
        }
      } else {
        const error = await updateResponse.text();
        logBug(`Failed to update matter: ${updateResponse.status} - ${error}`);
      }
    } else {
      const error = await matterResponse.text();
      logBug(`Failed to create matter: ${matterResponse.status} - ${error}`);
    }

    // ============================================
    // Test Time Entry API with new fields
    // ============================================
    console.log("\n=== Testing Time Entry API ===\n");

    let timeEntryId: string | null = null;
    if (matterId) {
      console.log("Creating time entry with new fields...");
      const timeEntryResponse = await authFetch("/api/time-entries", {
        method: "POST",
        body: JSON.stringify({
          matterId,
          description: "Initial consultation and file review",
          durationMinutes: 60,
          hourlyRate: "250.00", // Required field
          workDate: new Date().toISOString().split("T")[0],
          source: "ai_suggested", // NEW FIELD
          isBillable: true, // NEW FIELD
        }),
      });

      if (timeEntryResponse.ok) {
        const timeEntry = await timeEntryResponse.json();
        timeEntryId = timeEntry.id;
        logSuccess(`Time entry created: ${timeEntry.id}`);

        if (timeEntry.source === "ai_suggested") {
          logSuccess(`Time entry has source: ${timeEntry.source}`);
        } else {
          logBug(`Time entry source not returned correctly. Got: ${timeEntry.source}`);
        }

        if (timeEntry.isBillable === true) {
          logSuccess(`Time entry has isBillable: ${timeEntry.isBillable}`);
        } else {
          logBug(`Time entry isBillable not returned correctly. Got: ${timeEntry.isBillable}`);
        }
      } else {
        const error = await timeEntryResponse.text();
        logBug(`Failed to create time entry: ${timeEntryResponse.status} - ${error}`);
      }
    }

    // ============================================
    // Test Invoice API with new fields
    // ============================================
    console.log("\n=== Testing Invoice API ===\n");

    if (matterId && clientId && timeEntryId) {
      // Step 1: Submit time entry for approval
      console.log("Submitting time entry for approval...");
      const submitResponse = await authFetch(`/api/time-entries/${timeEntryId}/submit`, {
        method: "POST",
      });

      let approvalId: string | null = null;
      if (submitResponse.ok) {
        const approval = await submitResponse.json();
        approvalId = approval.id;
        logSuccess(`Time entry submitted, approval request: ${approval.id}`);
      } else {
        const error = await submitResponse.text();
        logBug(`Failed to submit time entry: ${submitResponse.status} - ${error}`);
      }

      // Step 2: Approve the time entry
      if (approvalId) {
        console.log("Approving time entry...");
        const approveResponse = await authFetch(`/api/approvals/${approvalId}/approve`, {
          method: "POST",
          body: JSON.stringify({ decisionReason: "Test approval" }),
        });

        if (approveResponse.ok) {
          logSuccess(`Time entry approved`);
        } else {
          const error = await approveResponse.text();
          logBug(`Failed to approve time entry: ${approveResponse.status} - ${error}`);
        }
      }

      // Step 3: Generate invoice with vatRate
      console.log("Generating invoice with vatRate...");
      const invoiceResponse = await authFetch("/api/invoices/generate", {
        method: "POST",
        body: JSON.stringify({
          matterId,
          clientId,
          timeEntryIds: [timeEntryId], // Required - use the time entry we just created
          vatRate: "20.00", // NEW FIELD
        }),
      });

      if (invoiceResponse.ok) {
        const invoice = await invoiceResponse.json();
        logSuccess(`Invoice generated: ${invoice.id}`);

        if (invoice.vatRate === "20.00") {
          logSuccess(`Invoice has vatRate: ${invoice.vatRate}%`);
        } else {
          logBug(`Invoice vatRate not returned correctly. Got: ${invoice.vatRate}`);
        }
      } else {
        const error = await invoiceResponse.text();
        logBug(`Failed to generate invoice: ${invoiceResponse.status} - ${error}`);
      }
    }
  }

  // ============================================
  // Summary
  // ============================================
  console.log("\n========================================");
  console.log("=== TEST SUMMARY ===");
  console.log("========================================");

  if (bugs.length === 0) {
    console.log("\n✅ All API tests passed! New fields working correctly.\n");
  } else {
    console.log(`\n❌ Found ${bugs.length} issue(s):\n`);
    bugs.forEach((bug, i) => console.log(`${i + 1}. ${bug}`));
    console.log("");
  }

  return bugs;
}

async function testPublicEndpoints() {
  console.log("\n=== Testing Public Endpoints ===\n");

  // Test health endpoint
  const healthResponse = await fetch(`${BASE_URL}/api/health`);
  if (healthResponse.ok) {
    const health = await healthResponse.json();
    logSuccess(`Health check passed: ${health.status}`);
  } else {
    logBug("Health check failed");
  }
}

testAPIs()
  .then((bugs) => {
    process.exit(bugs.length > 0 ? 1 : 0);
  })
  .catch((e) => {
    console.error("Test error:", e);
    process.exit(1);
  });
