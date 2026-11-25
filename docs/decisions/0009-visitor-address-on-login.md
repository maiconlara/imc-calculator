# 0009. Visitor address on login

- Status: accepted
- Date: 2026-11-24

## Context

The API limits failed logins per client address and username (`TRUST_PROXY`, see [backend.md](../architecture/backend.md#authentication-and-authorization)). The browser never calls the API: the panel server does, so the API sees the panel's address unless the panel tells it who the visitor is, through `X-Forwarded-For`.

Next.js only fills `X-Forwarded-For` with the visitor address when the request does not bring one. A visitor can send their own header, and the panel cannot tell it apart from one written by a real proxy. Passing that header to the API on every login would let anyone pick a new address for each attempt and never hit the limit.

## Decision

- The panel trusts `X-Forwarded-For` only as far as `TRUSTED_PROXY_COUNT` says: the number of reverse proxies in front of it that append the visitor address. With `N` proxies, it passes the `N`th address from the end, the one the outermost trusted proxy wrote, and ignores anything before it.
- With `TRUSTED_PROXY_COUNT=0` (the default, and the setup of development), the panel passes no address, and the API counts every login from the panel's own address.
- The API keeps trusting only its own proxy setting (`TRUST_PROXY`), which must include the panel's address.

## Consequences

- A visitor cannot get around the failed login limit by writing the header.
- Without a reverse proxy in front of the panel, the limit works per username for everyone: ten failed attempts on a username block it for ten minutes for every visitor, which someone could use to lock an account for a while. A production setup puts a reverse proxy in front of the panel and sets `TRUSTED_PROXY_COUNT=1`.
- Each new proxy layer must be counted in `TRUSTED_PROXY_COUNT`, or the panel passes the address of a proxy instead of the visitor.
- With a proxy in front, the panel must be reachable only through it. A visitor who reaches the panel directly writes the last `X-Forwarded-For` entry and picks their own address again.
- The proxy must pass the browser's `Host` header on (in nginx, `proxy_set_header Host $host`). The panel compares `Origin` with `Host` to refuse writes from other sites, so a proxy that sends its own upstream host makes every login, logout and change answer 403.
