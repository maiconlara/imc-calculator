# 0005. Session in httpOnly cookies through Next.js

- Status: accepted
- Date: 2026-11-23

## Context

The API authenticates with JWT. The simplest panel would keep the tokens in `localStorage` and send them from the browser, but then any script injected into the page can read and steal them. The panel also renders pages on the server, which need the token too.

## Decision

- The access token is a JWT signed with HS256 by `jsonwebtoken`, valid for 15 minutes by default, with issuer and audience checks.
- The refresh token is an opaque random value, valid for 7 days by default, stored in the database only as a SHA-256 hash. It is rotated on every use, and the previous one stays valid for 30 seconds so parallel requests holding it do not end the session.
- The Next.js server stores both tokens in `httpOnly` cookies with `SameSite=Lax`, and `Secure` in production. Browser JavaScript never sees them.
- The browser calls `/api/...` on the Next.js server. A route handler adds the token and forwards the request to the API. Requests that change data must come from the same origin.
- `proxy.ts` renews the session before rendering a page when the access cookie has expired.
- Server components call the API directly with the token from the cookie.
- The API reads the user from the database on every request, so deactivating a user takes effect on their next action.

## Consequences

- A script injected into the page cannot read the tokens.
- The API address is only known by the Next.js server.
- Every browser call takes one extra hop through the Next.js server.
- One database read per request to check the user status. Acceptable at this scale, and it is what makes deactivation immediate.
