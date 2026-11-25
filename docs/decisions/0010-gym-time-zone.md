# 0010. Gym time zone

- Status: accepted
- Date: 2026-11-24

## Context

The gym works in one city, and the dates people see and count follow its calendar: an assessment made on 31/10 at 22:30 belongs to October. But each part of the system ran on the calendar of its own machine:

- The panel renders dates on the server and again in the browser. With each one in its own time zone, the same assessment could show two different days, and React warns that the two renders differ.
- The API counted "assessments this month" from midnight of the first day in the server time zone. Containers and CI runners usually run in UTC, where that assessment from 31/10 at 22:30 in São Paulo falls on 01/11, so the dashboard would count it in November while the list shows it in October.

## Decision

- The gym time zone is one shared rule: `GYM_TIME_ZONE` (`America/Sao_Paulo`) in `packages/shared`.
- The panel formats every date in that zone (`lib/formatters.ts`).
- The API computes the start of the month in that zone (`shared/clock.ts`), with `Intl` and no date library, whatever the `TZ` of the machine.
- Dates keep travelling and being stored as UTC instants. Only showing them and cutting them by month use the gym zone.
- The backend and frontend tests run with `TZ=UTC`, so code that falls back on the machine's zone fails.

## Consequences

- The API and the panel can run on any machine, in any time zone, with no `TZ` setting to remember.
- A gym in another time zone changes one constant. Serving gyms in several time zones would need the zone per gym, which the system does not have.
- New code that cuts dates by day or month must use the gym zone, never `getMonth()`, `getDate()` or `new Date(year, month, day)`, which read the machine's zone. The tests in UTC catch most slips.
- The demo seed spreads assessments over the machine's days and hours. Its dates may fall at other hours of the gym day on a UTC machine, which is harmless for demo data.
