import "server-only";
import { randomUUID } from "crypto";
import path from "node:path";
import { mkdir, writeFile, readFile } from "node:fs/promises";

const UPLOAD_ROOT = process.env.UPLOAD_DIR || "private/uploads";

function localRoot() {
  return path.isAbsolute(UPLOAD_ROOT)
    ? UPLOAD_ROOT
    : path.join(process.cwd(), UPLOAD_ROOT);
}

function extensionFor(originalName) {
  const ext = path.extname(originalName || "").toLowerCase();
  return /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : "";
}

function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

/**
 * Store an uploaded file in private storage. Files are never written to public/.
 * Returns a storage key like `local:repairs/uuid.pdf` or `cloudinary:mix/...`.
 */
export async function savePrivateFile(file, folder = "misc") {
  const buffer = Buffer.from(await file.arrayBuffer());
  const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "").slice(0, 80) || "misc";

  if (cloudinaryConfigured()) {
    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `mix/${safeFolder}`,
          resource_type: "auto",
          type: "private",
          use_filename: true,
          unique_filename: true,
        },
        (error, uploaded) => {
          if (error) reject(error);
          else resolve(uploaded);
        },
      );
      stream.end(buffer);
    });

    return {
      key: `cloudinary:${result.public_id}`,
      size: buffer.length,
    };
  }

  const filename = `${randomUUID()}${extensionFor(file.name)}`;
  const directory = path.join(localRoot(), safeFolder);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), buffer, { mode: 0o600 });

  return {
    key: `local:${safeFolder}/${filename}`,
    size: buffer.length,
  };
}

export function isLocalKey(key) {
  return typeof key === "string" && key.startsWith("local:");
}

export function localKeyToPath(key) {
  if (!isLocalKey(key)) throw new Error("Invalid storage key");
  const relative = key.slice("local:".length);
  const resolved = path.resolve(localRoot(), relative);
  const root = path.resolve(localRoot());
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error("Invalid storage path");
  }
  return resolved;
}

export async function readLocalFile(key) {
  const filePath = localKeyToPath(key);
  const buffer = await readFile(filePath);
  return buffer;
}

export function cloudinaryPublicId(key) {
  if (!key.startsWith("cloudinary:")) throw new Error("Invalid storage key");
  return key.slice("cloudinary:".length);
}

export function storageProvider() {
  return cloudinaryConfigured() ? "cloudinary" : "local";
}
