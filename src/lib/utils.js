import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { randomBytes } from "crypto";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function randomToken(bytes = 24) {
  return randomBytes(bytes).toString("hex");
}

export function generateReference(prefix) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const raw = randomBytes(6);
  let out = "";
  for (let i = 0; i < raw.length; i += 1) {
    out += alphabet[raw[i] % alphabet.length];
  }
  return `MIX-${prefix}-${out}`;
}

export function privateFileUrl(key) {
  if (!key) return "";
  return `/api/files/${encodeURIComponent(key)}`;
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function truncate(value, length = 120) {
  if (!value) return "";
  return value.length > length ? `${value.slice(0, length).trim()}…` : value;
}

export function safeRedirectPath(value, fallback = "/") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export function titleCaseStatus(value) {
  return String(value || "")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
