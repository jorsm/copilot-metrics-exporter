import http, { Server } from "http";
import { registry } from "./metrics";

let server: Server | undefined;
const PORT = 9099;

export function startMetricsServer() {
  if (server) {
    return;
  } // Already running
  server = http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/metrics") {
      try {
        const metrics = await registry.metrics();
        res.writeHead(200, { "Content-Type": registry.contentType });
        res.end(metrics);
      } catch (err) {
        console.error("Error collecting metrics:", err);
        res.writeHead(500);
        res.end("Error collecting metrics");
      }
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  server.on("error", (err: Error) => {
    console.error(`Metrics server error: ${err.message}`);
    if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use.`);
    }
    server = undefined;
  });

  server.listen(PORT, () => {
    console.log(`Metrics server listening on http://localhost:${PORT}/metrics`);
  });
}

export function stopMetricsServer() {
  if (server) {
    server.close();
    server = undefined;
  }
}
