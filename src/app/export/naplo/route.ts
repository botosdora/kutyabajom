import type { NextRequest } from "next/server";
import { fileSlug, pdfResponse } from "@/lib/pdf/base";
import { defaultJournalRange, journalPdf } from "@/lib/pdf/documents";
import { requireCurrentPet } from "@/lib/pets";

export async function GET(request: NextRequest) {
  const pet = await requireCurrentPet();
  const { from, to } = defaultJournalRange(request.nextUrl.searchParams.get("tol"), request.nextUrl.searchParams.get("ig"));
  return pdfResponse(await journalPdf(pet, from, to), `naplo-${fileSlug(pet.name)}-${from}-${to}.pdf`);
}
