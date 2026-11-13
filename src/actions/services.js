"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serviceRequestSchema } from "@/lib/validation/service";
import { generateReference } from "@/lib/utils";
import { savePrivateFile } from "@/lib/storage";
import { notify, auditLog } from "@/lib/notifications";
import { normalizeMsisdn } from "@/lib/payments/daraja";
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE } from "@/lib/constants";

export async function submitServiceRequestAction(prevState, formData) {
  const session = await auth();

  const parsed = serviceRequestSchema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    serviceId: formData.get("serviceId"),
    instructions: formData.get("instructions"),
    pages: formData.get("pages"),
    copies: formData.get("copies"),
    outputFormat: formData.get("outputFormat"),
    consent: formData.get("consent"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Check the request details." };
  }

  const service = await prisma.digitalService.findUnique({
    where: { id: parsed.data.serviceId },
  });
  if (!service || !service.isActive) {
    return { error: "That service is not currently available." };
  }

  const files = formData
    .getAll("documents")
    .filter((file) => file && typeof file === "object" && file.size > 0);

  if (files.length > 3) {
    return { error: "Please upload no more than 3 documents." };
  }

  for (const file of files) {
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      return {
        error: `${file.name || "One file"} is not a supported file type. Use PDF, Word, PNG, JPG or TXT.`,
      };
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      return { error: `${file.name || "One document"} is larger than 10MB.` };
    }
  }

  const stored = [];
  try {
    for (const file of files) {
      const result = await savePrivateFile(file, "service-requests");
      stored.push({
        storageKey: result.key,
        originalName: file.name || "document",
        mimeType: file.type,
        size: file.size,
      });
    }
  } catch (error) {
    console.error("[services] upload failed", error);
    return { error: "We could not save your documents. Please try again." };
  }

  const phone = normalizeMsisdn(parsed.data.phone);
  const reference = generateReference("DIG");
  const userId = session?.user?.id || null;

  try {
    await prisma.serviceRequest.create({
      data: {
        reference,
        userId,
        customerName: parsed.data.customerName,
        phone,
        email: parsed.data.email || null,
        serviceId: service.id,
        instructions: parsed.data.instructions,
        pages: Number.isFinite(parsed.data.pages) ? parsed.data.pages : null,
        copies: Number.isFinite(parsed.data.copies) ? parsed.data.copies : null,
        outputFormat: parsed.data.outputFormat || null,
        status: "SUBMITTED",
        documents: { create: stored },
        statusHistory: {
          create: {
            status: "SUBMITTED",
            note: "Digital service request received online.",
          },
        },
      },
    });
  } catch (error) {
    console.error("[services] failed to create request", error);
    return { error: "We could not submit your request. Please try again." };
  }

  await notify({
    userId,
    type: "SERVICE_REQUEST_RECEIVED",
    title: `Request received — ${reference}`,
    message: `We received your ${service.name} request. Reference ${reference}. We will review the instructions and contact you if we need more information or a quote applies.`,
    email: parsed.data.email || null,
  });

  await auditLog({
    userId,
    action: "SERVICE_REQUEST_SUBMITTED",
    entity: "ServiceRequest",
    entityId: reference,
  });

  revalidatePath("/account/requests");
  redirect(`/digital-services/success?ref=${encodeURIComponent(reference)}`);
}
