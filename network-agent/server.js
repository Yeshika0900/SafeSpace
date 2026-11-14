import http from "node:http";
import os from "node:os";
import { pathToFileURL } from "node:url";
import { readInventory } from "./inventory.js";
export const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];
export function approvedOrigins(value = DEFAULT_ORIGINS.join(",")) {
  const list = value.split(",");
  if (
    !list.length ||
    list.some((origin) => {
      try {
        const url = new URL(origin);
        return (
          origin.includes("*") ||
          !["http:", "https:"].includes(url.protocol) ||
          url.origin !== origin ||
          url.username ||
          url.password
        );
      } catch {
        return true;
      }
    })
  )
    throw new Error(
      "Configure exact HTTP(S) origins; wildcards and paths are not allowed.",
    );
  return new Set(list);
}
export function createHelper({
  read = readInventory,
  origins = approvedOrigins(),
  cacheMs = 2000,
} = {}) {
  let pending,
    expires = 0;
  function inventory() {
    if (!pending || Date.now() >= expires) {
      expires = Infinity;
      pending = Promise.resolve().then(() => read());
      pending.then(
        () => {
          expires = Date.now() + cacheMs;
        },
        () => {
          expires = Date.now() + cacheMs;
        },
      );
    }
    return pending;
  }
  return http.createServer(
    { maxHeaderSize: 8192, requestTimeout: 10000, headersTimeout: 10000 },
    async (req, res) => {
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Content-Type", "application/json");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Vary", "Origin");
      const send = (status, value) => {
        res.writeHead(status);
        res.end(JSON.stringify(value));
      };
      const port = req.socket.localPort;
      if (
        ![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host)
      )
        return send(403, { error: "invalid_host" });
      const origin = req.headers.origin;
      if (typeof origin !== "string" || !origins.has(origin))
        return send(403, { error: "origin_denied" });
      res.setHeader("Access-Control-Allow-Origin", origin);
      if (req.url !== "/api/network-devices")
        return send(404, { error: "not_found" });
      if (req.method === "OPTIONS") {
        const headers = String(
          req.headers["access-control-request-headers"] || "",
        )
          .toLowerCase()
          .split(",")
          .map((x) => x.trim());
        if (
          req.headers["access-control-request-method"] !== "GET" ||
          headers.length !== 1 ||
          headers[0] !== "x-safespace-client"
        )
          return send(403, { error: "invalid_preflight" });
        res.setHeader("Access-Control-Allow-Methods", "GET");
        res.setHeader("Access-Control-Allow-Headers", "X-SafeSpace-Client");
        if (req.headers["access-control-request-private-network"] === "true")
          res.setHeader("Access-Control-Allow-Private-Network", "true");
        res.writeHead(204);
        res.end();
        return;
      }
      if (req.method !== "GET")
        return send(405, { error: "method_not_allowed" });
      if (
        req.headers["x-safespace-client"] !== "inventory-v1" ||
        req.headers["transfer-encoding"] ||
        Number(req.headers["content-length"] || 0) !== 0
      )
        return send(400, { error: "invalid_request" });
      try {
        send(200, {
          hostname: os.hostname(),
          retrievedAt: new Date().toISOString(),
          devices: await inventory(),
          source: "Local IPv4 neighbour cache",
        });
      } catch {
        send(503, { error: "inventory_unavailable" });
      }
    },
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const server = createHelper({
    origins: approvedOrigins(process.env.SAFESPACE_ALLOWED_ORIGINS),
  });
  server.listen(4174, "127.0.0.1", () =>
    console.log(
      "SafeSpace helper: http://127.0.0.1:4174 (IPv4 neighbours only)",
    ),
  );
}
