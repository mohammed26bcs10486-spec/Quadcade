const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = path.join(__dirname, "quadcade");
const DB_PATH = path.join(__dirname, ".quadcade-data.json");
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch (error) {
    return { shared: {}, private: {} };
  }
}

let state = loadState();

function saveState() {
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  response.end(JSON.stringify(payload));
}

function getClientStore(clientId) {
  state.private[clientId] = state.private[clientId] || {};
  return state.private[clientId];
}

function getStorageValue(key, shared, clientId) {
  const store = shared ? state.shared : getClientStore(clientId);
  return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
}

function setStorageValue(key, value, shared, clientId) {
  const store = shared ? state.shared : getClientStore(clientId);
  store[key] = value;
  saveState();
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (error) { reject(error); }
    });
    request.on("error", reject);
  });
}

function serveStatic(request, response, pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(ROOT, `.${requested}`);
  if (!filePath.startsWith(`${ROOT}${path.sep}`)) return sendJson(response, 403, { error: "Forbidden" });
  fs.readFile(filePath, (error, content) => {
    if (error) return sendJson(response, error.code === "ENOENT" ? 404 : 500, { error: "File not found" });
    response.writeHead(200, { "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream" });
    response.end(content);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  if (request.method === "OPTIONS") {
    response.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, PUT, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
    return response.end();
  }
  if (url.pathname === "/api/health") return sendJson(response, 200, { ok: true, service: "quadcade" });

  const match = url.pathname.match(/^\/api\/storage\/([^/]+)$/);
  if (match) {
    const key = decodeURIComponent(match[1]);
    const shared = url.searchParams.get("shared") === "1";
    const clientId = url.searchParams.get("client") || "anonymous";
    if (request.method === "GET") return sendJson(response, 200, { value: getStorageValue(key, shared, clientId) });
    if (request.method === "PUT") {
      try {
        const body = await readBody(request);
        setStorageValue(key, body.value, shared, clientId);
        return sendJson(response, 200, { ok: true });
      } catch (error) {
        return sendJson(response, 400, { error: "Invalid JSON" });
      }
    }
  }

  if (url.pathname === "/api/storage" && request.method === "GET") {
    const prefix = url.searchParams.get("prefix") || "";
    const shared = url.searchParams.get("shared") === "1";
    const clientId = url.searchParams.get("client") || "anonymous";
    const store = shared ? state.shared : getClientStore(clientId);
    return sendJson(response, 200, { keys: Object.keys(store).filter((key) => key.startsWith(prefix)) });
  }

  serveStatic(request, response, url.pathname);
});

server.listen(PORT, () => {
  console.log(`QUADCADE running at http://localhost:${PORT}`);
  console.log(`Persistent data file: ${DB_PATH}`);
});
