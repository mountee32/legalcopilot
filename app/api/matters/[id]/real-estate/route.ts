/**
 * PATCH /api/matters/[id]/real-estate
 *
 * US-first alias for updating real-estate matter data.
 * Internally delegates to the legacy conveyancing route for backward compatibility.
 */

export { PATCH } from "@/app/api/matters/[id]/conveyancing/route";
