import { fileSlug, pdfResponse } from "@/lib/pdf/base";
import { medicationsPdf } from "@/lib/pdf/documents";
import { requireCurrentPet } from "@/lib/pets";
import { todayIso } from "@/lib/format";

export async function GET() {
  const pet = await requireCurrentPet();
  return pdfResponse(await medicationsPdf(pet), `gyogyszerek-${fileSlug(pet.name)}-${todayIso()}.pdf`);
}
