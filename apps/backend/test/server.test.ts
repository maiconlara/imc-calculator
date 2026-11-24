import { createServer, type Server } from "node:net";
import { pino } from "pino";
import { afterEach, describe, expect, it } from "vitest";
import { startServer, type RunningServer } from "../src/server";

const silentLogger = pino({ level: "silent" });
const serverSettings = {
  DB_DATABASE: ":memory:",
  CORS_ORIGIN: [],
  TRUST_PROXY: false,
};

let runningServer: RunningServer | undefined;
let portBlocker: Server | undefined;

afterEach(async () => {
  await runningServer?.close();
  await new Promise<void>((resolve) =>
    portBlocker ? portBlocker.close(() => resolve()) : resolve(),
  );
  runningServer = undefined;
  portBlocker = undefined;
});

function blockAPort(): Promise<number> {
  return new Promise((resolve) => {
    portBlocker = createServer().listen(0, () => {
      const blockedAddress = portBlocker?.address();
      resolve(
        typeof blockedAddress === "object" && blockedAddress ? blockedAddress.port : 0,
      );
    });
  });
}

describe("startServer", () => {
  it("starts on a free port and answers the health check", async () => {
    runningServer = await startServer({ ...serverSettings, PORT: 0 }, silentLogger);

    const response = await fetch(`http://localhost:${runningServer.port}/api/health`);

    expect(response.status).toBe(200);
  });

  it("fails instead of reporting a start when the port is taken", async () => {
    const takenPort = await blockAPort();

    await expect(
      startServer({ ...serverSettings, PORT: takenPort }, silentLogger),
    ).rejects.toMatchObject({ code: "EADDRINUSE" });
  });
});
