/**
 * POST /api/real-estate/searches/order
 *
 * US-first alias for ordering property searches.
 * Internally delegates to the legacy conveyancing route for backward compatibility.
 */

export { POST } from "@/app/api/conveyancing/searches/order/route";
