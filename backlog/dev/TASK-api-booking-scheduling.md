# TASK: Booking & scheduling endpoints

## Goal

Support appointment types, availability rules, and booking creation tied to leads/matters.

## Scope

- Availability windows + buffers + appointment types
- Booking creation (public) with abuse controls (rate limiting, CAPTCHA if needed)
- Calendar event creation + linking to lead/matter

## Acceptance Criteria

- Frontend can build a booking page without direct calendar-provider coupling
- Bookings are auditable and tenant-scoped

## References

- `docs/ideas.md` (Epic 18)

## Design

### New Schema (`lib/db/schema/booking.ts`)

- `appointmentTypes`: consultation types with duration, buffer, practice area
- `availabilityRules`: recurring weekly patterns + date overrides
- `bookings`: linked to leads/matters and calendar events

### Endpoints

| Endpoint                                                | Auth             | Purpose                |
| ------------------------------------------------------- | ---------------- | ---------------------- |
| `GET /api/public/booking/firms/{firmSlug}/types`        | Public           | List appointment types |
| `GET /api/public/booking/firms/{firmSlug}/availability` | Public           | Get available slots    |
| `POST /api/public/booking/firms/{firmSlug}/bookings`    | Public+RateLimit | Create booking         |
| `GET/POST /api/booking/appointment-types`               | Auth             | Manage types           |
| `GET/PATCH /api/booking/availability-rules`             | Auth             | Manage availability    |
| `GET/PATCH /api/booking/bookings`                       | Auth             | List/update bookings   |

### Abuse Controls

- `withRateLimit` (3/min) for public endpoints
- Optional CAPTCHA verification
- Email verification before confirming

### Test Strategy

- Unit: availability calculation, buffer application
- Integration: booking creation with calendar event
- E2E: full public booking flow
