/* ---------- Storage helper ----------
   Wraps window.storage (persists across sessions) with an in-memory
   fallback so every page keeps working even if storage isn't available.
   Personal keys (shared:false) are only visible to you.
   Shared keys (shared:true) are visible to everyone using QUADCADE. */

const memoryFallback = {};

function backendClientId() {
  let id = window.localStorage.getItem("quadcade-client-id");
  if (!id) {
    id = `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem("quadcade-client-id", id);
  }
  return id;
}

function backendEnabled() {
  return location.protocol === "http:" || location.protocol === "https:";
}

async function backendRequest(path, options = {}) {
  if (!backendEnabled()) throw new Error("backend unavailable from file URL");
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`storage request failed: ${response.status}`);
  return response.json();
}

async function qGet(key, shared = false) {
  try {
    if (window.storage) {
      const result = await window.storage.get(key, shared);
      return result ? JSON.parse(result.value) : null;
    }
    if (backendEnabled()) {
      return (await backendRequest(`/api/storage/${encodeURIComponent(key)}?shared=${shared ? "1" : "0"}&client=${encodeURIComponent(backendClientId())}`)).value;
    }
    const value = window.localStorage.getItem(key);
    return value === null ? null : JSON.parse(value);
  } catch (err) {
    return memoryFallback[key] ?? null;
  }
}

async function qSet(key, value, shared = false) {
  memoryFallback[key] = value;
  try {
    if (window.storage) {
      await window.storage.set(key, JSON.stringify(value), shared);
    } else if (backendEnabled()) {
      await backendRequest(`/api/storage/${encodeURIComponent(key)}?shared=${shared ? "1" : "0"}&client=${encodeURIComponent(backendClientId())}`, {
        method: "PUT",
        body: JSON.stringify({ value }),
      });
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (err) {
    /* silently keep the in-memory copy */
  }
}

async function qList(prefix, shared = false) {
  try {
    if (window.storage) {
      const result = await window.storage.list(prefix, shared);
      return result ? result.keys : [];
    }
    if (backendEnabled()) {
      return (await backendRequest(`/api/storage?prefix=${encodeURIComponent(prefix)}&shared=${shared ? "1" : "0"}&client=${encodeURIComponent(backendClientId())}`)).keys;
    }
    return Object.keys(localStorage).filter((key) => key.startsWith(prefix));
  } catch (err) {
    return Object.keys(memoryFallback).filter((k) => k.startsWith(prefix));
  }
}
