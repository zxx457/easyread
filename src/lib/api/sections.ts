export interface Section {
  doc_id: string;
  id: string;
  order: number;
  text: string;
  image: string;
  candidates: string[];
}

type RawSectionDTO = Record<string, unknown>;

function toImageSrc(value: unknown, fallbackLabel: string): string {
  if (typeof value === "string" && /^https?:\/\//.test(value)) return value;
  if (typeof value === "string" && value)
    return `https://placehold.co/600x400?text=${encodeURIComponent(fallbackLabel)}`;
  return "https://placehold.co/600x400?text=Image";
}

function fromDto(section: RawSectionDTO, order: number): Section {
  const id = String(section.id ?? "");
  const doc_id = String(section.doc_id ?? section.document_id ?? "");
  const text = typeof section.text === "string" ? section.text : "";
  const image = toImageSrc(section.image, id ? `Image ${id}` : "Image");

  return {
    id,
    doc_id,
    order,
    text,
    image,
    candidates: [],
  };
}

/**************************************************/

export async function fetchSections(doc_id: string): Promise<Section[]> {
  const sectionIdsRes = await fetch(`/api/docs/${doc_id}/sections`, { cache: "no-store" });
  if (!sectionIdsRes.ok) throw new Error("Failed to fetch section IDs");
  const sectionIds = (await sectionIdsRes.json()) as string[];

  const sections = await Promise.all(
    sectionIds.map(async (sectionId, index) => {
      const sectionRes = await fetch(`/api/sections/${sectionId}`, { cache: "no-store" });
      if (!sectionRes.ok) throw new Error(`Failed to fetch section ${sectionId}`);
      const sectionDto = (await sectionRes.json()) as RawSectionDTO;

      const candidatesRes = await fetch(`/api/sections/${sectionId}/candidates`, { cache: "no-store" });
      let candidates: string[] = [];
      if (candidatesRes.ok) {
        const candidateIds = (await candidatesRes.json()) as string[];
        candidates = candidateIds.map((candidateId, candidateIndex) =>
          toImageSrc(candidateId, `Candidate ${candidateIndex + 1}`),
        );
      }

      return {
        ...fromDto(sectionDto, index),
        candidates,
      };
    }),
  );

  return sections.sort((a, b) => a.order - b.order);
}

export async function fetchSection(id: string, order = 0): Promise<Section> {
  const sectionRes = await fetch(`/api/sections/${id}`, { cache: "no-store" });
  if (!sectionRes.ok) throw new Error("Failed to fetch section");
  const sectionDto = (await sectionRes.json()) as RawSectionDTO;

  const candidatesRes = await fetch(`/api/sections/${id}/candidates`, { cache: "no-store" });
  let candidates: string[] = [];
  if (candidatesRes.ok) {
    const candidateIds = (await candidatesRes.json()) as string[];
    candidates = candidateIds.map((candidateId, candidateIndex) =>
      toImageSrc(candidateId, `Candidate ${candidateIndex + 1}`),
    );
  }

  return {
    ...fromDto(sectionDto, order),
    candidates,
  };
}

export async function addNewSection(doc_id: string): Promise<Section> {
  const res = await fetch(`/api/docs/${doc_id}/sections`);
  if (!res.ok) throw new Error("Failed to fetch sections");
  const currentIds = (await res.json()) as string[];

  const createRes = await fetch(`/api/docs/${doc_id}/sections`, {
    method: "POST",
  });
  if (!createRes.ok) throw new Error("Failed to add new section");
  const newSectionId = (await createRes.json()) as string;
  return fetchSection(newSectionId, currentIds.length);
}

export async function updateSection(id: string, data: { text?: string; image?: string }): Promise<void> {
  const res = await fetch(`/api/sections/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update section");
}

export async function deleteSection(id: string): Promise<void> {
  const res = await fetch(`/api/sections/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete section");
}

export async function reorderSections(
  doc_id: string,
  payload: { target: string; after?: string | null; before?: string | null },
): Promise<void> {
  const res = await fetch(`/api/docs/${doc_id}/sections/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to reorder sections");
}

export async function generateSectionCandidates(id: string, payload: Record<string, unknown> = {}): Promise<string[]> {
  const res = await fetch(`/api/sections/${id}/candidates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to generate section candidates");
  const data = (await res.json()) as string[];
  return data;
}
