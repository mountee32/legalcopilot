/**
 * POST /api/estate/account
 *
 * US-first alias for generating estate account summaries.
 * Internally delegates to the probate estate-account route for backward compatibility.
 */

export { POST } from "@/app/api/probate/estate-account/route";
