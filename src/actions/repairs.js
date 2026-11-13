"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { repairRequestSchema } from "@/lib/validation/repair";
import { generateReference } from "@/lib/utils";
import { savePrivateFile } from "@/lib/storage";
import { notify, auditLog } from "@/lib/notifications";
import { normalizeMsisdn } from "@/lib/payments/daraja";
import {
  ALLOWED_REPAIR_IMAGE_TYPES,
  MAX_REPAIR_IMAGE_SIZE,
} from "@/lib/constants";

export async function submitRepairAction(prevState, formData) {
  const session = await auth();

  const parsed = repairRequestSchema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    deviceBrand: formData.get("deviceBrand"),
    deviceModel: formData.get("deviceModel"),
    deviceType: formData.get("deviceType"),
    problemDescription: formData.get("problemDescription"),
    preferredDate: formData.get("preferredDate"),
    additionalInfo: formData.get("additionalInfo"),
    consent: formData.get("consent"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Check the repair details." };
  }

  const photos = formData
    .getAll("photos")
    .filter((file) => file && typeof file === "object" && file.size > 0);

  if (photos.length > 4) {
    return { error: "Please upload no more than 4 photos of the device." };
  }

  for (const photo of photos) {
    if (!ALLOWED_REPAIR_IMAGE_TYPES.includes(photo.type)) {
      return { error: `${photo.name || "One file"} is not a supported image. Use JPG, PNG or WebP.` };
    }
    if (photo.size > MAX_REPAIR_IMAGE_SIZE) {
      return { error: `${photo.name || "One image"} is larger than 5MB.` };
    }
  }

  const stored = [];
  try {
    for (const photo of photos) {
      const result = await savePrivateFile(photo, "repairs");
      stored.push({
        storageKey: result.key,
        originalName: photo.name || "device-photo",
        mimeType: photo.type,
        size: photo.size,
      });
    }
  } catch (error) {
    console.error("[repairs] upload failed", error);
    return { error: "We could not save your photos. Please try again." };
  }

  const phone = normalizeMsisdn(parsed.data.phone);
  const reference = generateReference("REP");
  const userId = session?.user?.id || null;

  try {
    await prisma.repairRequest.create({
      data: {
        reference,
        userId,
        customerName: parsed.data.customerName,
        phone,
        email: parsed.data.email || null,
        deviceBrand: parsed.data.deviceBrand,
        deviceModel: parsed.data.deviceModel,
        deviceType: parsed.data.deviceType,
        problemDescription: parsed.data.problemDescription,
        preferredDate: parsed.data.preferredDate
          ? new Date(parsed.data.preferredDate)
          : null,
        additionalInfo: parsed.data.additionalInfo || null,
        status: "SUBMITTED",
        images: { create: stored },
        statusHistory: {
          create: {
            status: "SUBMITTED",
            note: "Repair request received online.",
          },
        },
      },
    });
  } catch (error) {
    console.error("[repairs] failed to create request", error);
    return { error: "We could not submit your repair request. Please try again." };
  }

  await notify({
    userId,
    type: "REPAIR_RECEIVED",
    title: `Repair request received — ${reference}`,
    message: `We received your repair request for the ${parsed.data.deviceBrand} ${parsed.data.deviceModel}. Reference ${reference}. This does not yet confirm that the repair has been accepted or started — we will diagnose the device and contact you with an estimate.`,
    email: parsed.data.email || null,
  });

  await auditLog({
    userId,
    action: "REPAIR_SUBMITTED",
    entity: "RepairRequest",
    entityId: reference,
  });

  revalidatePath("/account/repairs");
  redirect(`/repairs/success?ref=${encodeURIComponent(reference)}`);
}
