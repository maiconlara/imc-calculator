import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import type { LoginResponse } from "@imc-calculator/shared";
import { NextRequest } from "next/server";

export interface ReceivedRequest {
  method: string;
  url: string;
  authorization: string | undefined;
  forwardedFor: string | undefined;
  contentType: string | undefined;
  body: string;
}

export type FakeBackendHandler = (
  receivedRequest: ReceivedRequest,
  response: ServerResponse,
) => void;

export interface FakeBackend {
  url: string;
  receivedRequests: ReceivedRequest[];
  handle: (handler: FakeBackendHandler) => void;
  close: () => Promise<void>;
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    request.on("data", (chunk: Buffer) => {
      body += chunk.toString("utf8");
    });
    request.on("end", () => resolve(body));
  });
}

export const PANEL_ORIGIN = "http://localhost:3000";

/**
 * Session the fake API hands out, with tokens valid for 15 minutes and 7 days from
 * the moment it is built.
 *
 * @param accessToken - Access token to return.
 * @param refreshToken - Refresh token to return.
 * @returns A login or refresh answer of the API.
 */
export function buildLoginResponse(
  accessToken: string,
  refreshToken: string,
): LoginResponse {
  return {
    accessToken,
    accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    refreshToken,
    refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      id: "carla-id",
      name: "Carla Mendes",
      username: "carla.mendes",
      role: "teacher",
    },
  };
}

/**
 * Builds a request to the panel as the browser would send it.
 *
 * @param path - Path and query on the panel.
 * @param options - Method, cookies, extra headers and JSON body.
 * @returns The request for a route handler or the proxy.
 */
export function buildPanelRequest(
  path: string,
  options: {
    method?: string;
    cookies?: Record<string, string>;
    headers?: Record<string, string>;
    body?: unknown;
  } = {},
): NextRequest {
  const cookieHeader = Object.entries(options.cookies ?? {})
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  return new NextRequest(`${PANEL_ORIGIN}${path}`, {
    method: options.method ?? "GET",
    headers: {
      host: "localhost:3000",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

export function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

/**
 * Starts an HTTP server on a free port that stands in for the API, records every
 * request it receives and answers with the handler set by the test.
 *
 * @returns The server address, the received requests and a way to stop it.
 */
export async function startFakeBackend(): Promise<FakeBackend> {
  const receivedRequests: ReceivedRequest[] = [];
  let currentHandler: FakeBackendHandler = (_receivedRequest, response) =>
    sendJson(response, 500, { message: "No handler" });

  const server: Server = createServer(async (request, response) => {
    const receivedRequest: ReceivedRequest = {
      method: request.method ?? "",
      url: request.url ?? "",
      authorization: request.headers.authorization,
      forwardedFor: request.headers["x-forwarded-for"]?.toString(),
      contentType: request.headers["content-type"],
      body: await readBody(request),
    };
    receivedRequests.push(receivedRequest);
    currentHandler(receivedRequest, response);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const listeningAddress = server.address();
  const port =
    typeof listeningAddress === "object" && listeningAddress !== null
      ? listeningAddress.port
      : 0;

  return {
    url: `http://127.0.0.1:${port}/api`,
    receivedRequests,
    handle: (handler) => {
      currentHandler = handler;
    },
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}
