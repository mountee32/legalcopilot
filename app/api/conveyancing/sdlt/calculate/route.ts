/**
 * POST /api/conveyancing/sdlt/calculate
 *
 * Retired endpoint.
 * UK SDLT calculation is not supported in the US product direction.
 */

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Endpoint retired",
      code: "ENDPOINT_RETIRED",
      message:
        "This UK SDLT calculator endpoint was retired during the US pivot and is no longer available.",
      replacement: null,
    },
    { status: 410 }
  );
}
