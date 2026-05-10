export interface Doc {
  id: string;
  title: string;
  created: Date;
  status: "ready" | "pending";
}

type RawDocDTO = Record<string, unknown>;
export type DocOrderBy = "title" | "-title" | "modified" | "-modified" | "created" | "-created";

export interface FetchDocsParams {
  search?: string;
  page?: number;
  pageSize?: number;
  orderBy?: DocOrderBy;
}

export interface FetchDocsResult {
  items: Doc[];
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

function parseDate(value: unknown): Date {
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function parseStatus(value: unknown): Doc["status"] {
  if (typeof value !== "string") return "pending";
  const normalized = value.toLowerCase();
  if (["ready", "done", "completed", "success", "processed"].includes(normalized)) return "ready";
  return "pending";
}

export function fromDto(dto: RawDocDTO): Doc {
  const id = String(dto.id ?? "");
  const title = typeof dto.title === "string" && dto.title.trim() ? dto.title : "Untitled Document";
  const created = parseDate(dto.created ?? dto.modified ?? dto.updated_at);
  const status = parseStatus(dto.status ?? dto.processing_status ?? dto.state);

  return { id, title, created, status };
}

/**************************************************/

// Fetch docs page from backend array response
export async function fetchDocs(params: FetchDocsParams = {}): Promise<FetchDocsResult> {
  const page = Math.max(params.page ?? 1, 1);
  const pageSize = Math.max(params.pageSize ?? 10, 1);
  const query = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    order_by: params.orderBy ?? "-created",
  });
  if (params.search?.trim()) query.set("search", params.search.trim());

  const res = await fetch(`/api/documents?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch documents");

  const dtos: RawDocDTO[] = await res.json();
  const items = dtos.map(fromDto).filter((doc) => !!doc.id);
  console.log(items.length);

  return {
    items,
    page,
    pageSize,
    hasNextPage: items.length === pageSize,
  };
}

// Fetch a single doc
export async function fetchDoc(id: string): Promise<Doc> {
  const res = await fetch(`/api/documents/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch document");

  const dto: RawDocDTO = await res.json();
  return fromDto(dto);
}

export async function uploadDocument(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload document");

  const data = (await res.json()) as Record<string, unknown>;
  const id = data.id ?? data.file_id ?? data.fileId;
  if (typeof id !== "string" || !id) {
    throw new Error("Upload succeeded but no file ID was returned");
  }
  return id;
}

export interface CreateDocumentPayload {
  files?: string[];
  query: string;
  language_style: "plain" | "easyread";
  auto_generate_images: boolean;
  image_generation_options?: Record<string, unknown>;
}

export async function createDocument(payload: CreateDocumentPayload): Promise<string> {
  const res = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create document");

  const data = (await res.json()) as unknown;
  if (typeof data === "string" && data) return data;
  if (typeof data === "object" && data !== null) {
    const id = (data as Record<string, unknown>).id ?? (data as Record<string, unknown>).doc_id;
    if (typeof id === "string" && id) return id;
  }
  throw new Error("Document creation succeeded but no document ID was returned");
}

export async function updateDocTitle(id: string, title: string): Promise<void> {
  const res = await fetch(`/api/documents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to update document");
}

export async function deleteDoc(id: string): Promise<void> {
  const res = await fetch(`/api/documents/${id}`, { method: "DELETE", cache: "no-store" });
  if (!res.ok) throw new Error("Failed to delete document");
}
