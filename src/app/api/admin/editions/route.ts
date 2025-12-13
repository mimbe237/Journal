import { NextRequest, NextResponse } from "next/server";
import { EditionType, UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { createEdition, listEditions } from "@/modules/editions/editionService";
import { fileStorageProvider } from "@/services/fileStorage";
import { convertPdfToImages } from "@/services/pdf/pdfConversionService";
import path from "path";
import { updateEditionPageCount } from "@/modules/editions/editionService";

// GET : liste des éditions (admin)
export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.SUPPORT]);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);
    const type = searchParams.get("type") as EditionType | null;
    const order = (searchParams.get("order") as "ASC" | "DESC") ?? "DESC";

    const result = await listEditions({ page, pageSize, type: type ?? undefined, order });
    return NextResponse.json({ 
      editions: result.data, 
      total: result.total,
      page,
      pageSize 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur de récupération" }, { status: 400 });
  }
}

// POST : upload + création d'édition (admin)
export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.SUPPORT]);
    const form = await req.formData();
    const pdfFile = form.get("file");
    const titre = form.get("titre") as string;
    const datePublication = form.get("datePublication") as string;
    const type = form.get("type") as EditionType;

    if (!pdfFile || !(pdfFile instanceof File)) {
      return NextResponse.json({ error: "PDF requis" }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    const editionId = crypto.randomUUID();

    const pdfDestination = path.join("editions", editionId, "source.pdf");
    await fileStorageProvider.saveFile({ buffer: pdfBuffer, destinationPath: pdfDestination });

    const edition = await createEdition({
      titre,
      datePublication: new Date(datePublication),
      type,
      cheminInternePdf: pdfDestination,
      nombrePages: null
    });

    // Conversion PDF -> images (stub, à remplacer par implémentation réelle)
    const imagesDir = path.join("editions", edition.id, "images");
    const conversion = await convertPdfToImages({
      pdfPath: path.join(process.env.PRIVATE_STORAGE_ROOT ?? path.join(process.cwd(), "storage"), pdfDestination),
      outputDir: imagesDir,
      filenamePrefix: "page-"
    });

    if (conversion.pageCount > 0) {
      await updateEditionPageCount({ editionId: edition.id, nombrePages: conversion.pageCount });
    }

    return NextResponse.json({ edition, conversion }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de la création" }, { status: 400 });
  }
}
