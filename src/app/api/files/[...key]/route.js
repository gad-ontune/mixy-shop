import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  cloudinaryPublicId,
  isLocalKey,
  readLocalFile,
  storageProvider,
} from "@/lib/storage";

/**
 * Authorized private file delivery. Files are never served from /public.
 * Access is limited to admins/staff with the relevant permission, assigned
 * technicians, and the customer who submitted the document.
 */
export async function GET(request, { params }) {
  const { key: keyParts } = await params;
  const key = decodeURIComponent(keyParts.join("/"));

  if (!key.startsWith("local:") && !key.startsWith("cloudinary:")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await auth().then((session) => session?.user || null);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repairImage = await prisma.repairImage.findFirst({
    where: { storageKey: key },
    include: {
      repair: {
        select: { userId: true, assignedTechnicianId: true, reference: true },
      },
    },
  });

  const serviceDocument = repairImage
    ? null
    : await prisma.serviceDocument.findFirst({
        where: { storageKey: key },
        include: {
          request: { select: { userId: true, assignedToId: true, reference: true } },
        },
      });

  if (!repairImage && !serviceDocument) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = user.role === "ADMIN";
  const canManageRepairs = isAdmin || user.permissions?.includes("repairs.manage");
  const canManageServices = isAdmin || user.permissions?.includes("services.manage");

  let allowed = false;
  let filename = "document";
  let mimeType = "application/octet-stream";

  if (repairImage) {
    allowed =
      repairImage.repair.userId === user.id ||
      repairImage.repair.assignedTechnicianId === user.id ||
      canManageRepairs;
    filename = repairImage.originalName;
    mimeType = repairImage.mimeType;
  } else {
    allowed =
      serviceDocument.request.userId === user.id || canManageServices;
    filename = serviceDocument.originalName;
    mimeType = serviceDocument.mimeType;
  }

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isLocalKey(key)) {
    try {
      const buffer = await readLocalFile(key);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `inline; filename="${filename.replace(/[^\w.\- ]/g, "_")}"`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (error) {
      console.error("[files] local read failed", error);
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  if (storageProvider() !== "cloudinary") {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 500 });
  }

  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const url = cloudinary.utils.private_download_url(
    cloudinaryPublicId(key),
    undefined,
    { resource_type: "auto", type: "private", expires_at: Math.floor(Date.now() / 1000) + 300 },
  );

  return NextResponse.redirect(url);
}
