const express = require("express");
const multer = require("multer");
const fs = require("fs");
const Database = require("better-sqlite3");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const dataDir = "./data";
const dbPath = `${dataDir}/mock.db`;
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS uploads (
    id TEXT PRIMARY KEY,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    preview_url TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    files_json TEXT NOT NULL,
    language_style TEXT NOT NULL,
    auto_generate_images INTEGER NOT NULL,
    image_generation_options_json TEXT,
    created TEXT NOT NULL,
    modified TEXT NOT NULL,
    status TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    text TEXT NOT NULL,
    image TEXT,
    sort_order INTEGER NOT NULL,
    created TEXT NOT NULL,
    modified TEXT NOT NULL,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS section_candidates (
    id TEXT PRIMARY KEY,
    section_id TEXT NOT NULL,
    prompt TEXT,
    options_json TEXT,
    created_at TEXT NOT NULL,
    image_url TEXT,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Backwards compatible DB upgrade (if mock.db already exists without image_url).
try {
  const cols = db.prepare(`PRAGMA table_info(section_candidates)`).all();
  const hasImageUrl = cols.some((c) => c.name === "image_url");
  if (!hasImageUrl) db.exec(`ALTER TABLE section_candidates ADD COLUMN image_url TEXT`);
} catch (e) {
  // If this fails for any reason, the app will just fall back to returning `id` as candidates.
}

const seedDocs = [
  [
    "a611fc59-8c66-41c9-a91d-388e006cdb51",
    "Project Proposal",
    "[]",
    "plain",
    0,
    null,
    "2025-08-01T10:30:00Z",
    "2025-08-01T10:30:00Z",
    "ready",
  ],
  [
    "0790002c-93a4-4459-8dd9-725fbe39b858",
    "AI Research Notes",
    "[]",
    "easyread",
    1,
    null,
    "2025-08-05T14:20:00Z",
    "2025-08-06T08:00:00Z",
    "pending",
  ],
  [
    "dff9b262-0b32-4d56-84fc-05e5bf7ea472",
    "Meeting Summary",
    "[]",
    "plain",
    0,
    null,
    "2025-08-10T09:00:00Z",
    "2025-08-10T09:00:00Z",
    "ready",
  ],
  [
    "7a2a4f3c-a257-49aa-ab0b-7f713716b959",
    "User Feedback",
    "[]",
    "easyread",
    1,
    null,
    "2025-08-12T16:45:00Z",
    "2025-08-13T11:15:00Z",
    "pending",
  ],
  [
    "bff9e209-61b3-4c03-8c08-64f5fbf1312c",
    "Product Roadmap",
    "[]",
    "plain",
    0,
    null,
    "2025-08-14T12:10:00Z",
    "2025-08-14T12:10:00Z",
    "ready",
  ],
];

const docCount = db.prepare(`SELECT COUNT(*) AS count FROM documents`).get().count;
if (docCount === 0) {
  const insertSeed = db.prepare(`
    INSERT INTO documents (
      id, title, files_json, language_style, auto_generate_images,
      image_generation_options_json, created, modified, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((rows) => {
    for (const row of rows) insertSeed.run(...row);
  });
  insertMany(seedDocs);
}

const seedUsers = [
  ["2a8f3f67-fd89-4e5f-9f63-034df328cd66", "jane.doe@uwa.edu.au", "password123", "Jane Doe", "2025-08-01T10:30:00Z"],
  [
    "18b6bf41-f40d-4e2c-a8f6-157f70f84e9b",
    "john.smith@uwa.edu.au",
    "password123",
    "John Smith",
    "2025-08-02T10:30:00Z",
  ],
  ["1eeb53a1-f30d-4e1b-8d1a-66ab76aa8262", "alex.lee@uwa.edu.au", "password123", "Alex Lee", "2025-08-03T10:30:00Z"],
];

const userCount = db.prepare(`SELECT COUNT(*) AS count FROM users`).get().count;
if (userCount === 0) {
  const insertSeedUser = db.prepare(`
    INSERT INTO users (id, email, password, name, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertManyUsers = db.transaction((rows) => {
    for (const row of rows) insertSeedUser.run(...row);
  });
  insertManyUsers(seedUsers);
}

const sectionTemplates = [
  {
    text: "Intelife wants to hear from you.",
    image:
      "https://images.unsplash.com/photo-1521791055366-0d553872125f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
  {
    text: "You can give feedback or make a complaint.",
    image: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    text: "You do not have to give your name.",
    image:
      "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
  {
    text: "This includes clients, staff, and people with disability.",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
  {
    text: "Your feedback helps us improve our services.",
    image: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    text: "We follow NDIS rules to keep services safe and fair.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
  {
    text: "We handle all complaints quickly and fairly.",
    image: "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    text: "We will tell you what is happening with your complaint.",
    image:
      "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
  {
    text: "You can ask someone to help you speak up.",
    image: "https://images.pexels.com/photos/6647904/pexels-photo-6647904.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    text: "Staff learn how to support you with complaints every year.",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
  {
    text: "Complaints help us protect your rights.",
    image: "https://images.pexels.com/photos/6647903/pexels-photo-6647903.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    text: "They help stop harm or unfair treatment.",
    image:
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
  {
    text: "You can contact Intelife or the NDIS Commission.",
    image: "https://images.pexels.com/photos/8296988/pexels-photo-8296988.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    text: "We will listen to you.",
    image:
      "https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
];

const candidatePlaceholders = [
  "https://placehold.co/600x400?text=Candidate 2",
  "https://placehold.co/600x400?text=Candidate 3",
  "https://placehold.co/600x400?text=Candidate 4",
];

const insertSection = db.prepare(`
  INSERT INTO sections (id, document_id, text, image, sort_order, created, modified)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const deleteSectionsForDoc = db.prepare(`DELETE FROM sections WHERE document_id = ?`);
const insertCandidate = db.prepare(`
  INSERT INTO section_candidates (id, section_id, prompt, options_json, created_at, image_url)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const ensureSectionsForDocument = db.transaction((documentId, forceReset = false) => {
  const currentCount = db.prepare(`SELECT COUNT(*) AS count FROM sections WHERE document_id = ?`).get(documentId).count;
  const expectedCount = sectionTemplates.length;
  if (!forceReset && currentCount === expectedCount) return;

  deleteSectionsForDoc.run(documentId);
  const now = new Date().toISOString();
  sectionTemplates.forEach((tpl, index) => {
    const sectionId = uuidv4();
    insertSection.run(sectionId, documentId, tpl.text, tpl.image, index + 1, now, now);

    const candidateUrls = [tpl.image, ...candidatePlaceholders];
    candidateUrls.forEach((candidateUrl) => {
      insertCandidate.run(uuidv4(), sectionId, null, null, now, candidateUrl);
    });
  });
});

const seedSectionsForAllDocuments = db.transaction(() => {
  const docsForSections = db.prepare(`SELECT id FROM documents`).all();
  for (const doc of docsForSections) ensureSectionsForDocument(doc.id);
});

seedSectionsForAllDocuments();

const allowedLanguageStyles = new Set(["plain", "easyread"]);
const allowedOrderBy = new Set(["title", "-title", "modified", "-modified", "created", "-created"]);
const defaultPage = 1;
const defaultPageSize = 20;

// 1. Configure Multer
const upload = multer({
  dest: "temp/",
  limits: { fileSize: 10 * 1024 * 1024 },
});

const parseDoc = (row) => ({
  id: row.id,
  title: row.title,
  files: JSON.parse(row.files_json),
  language_style: row.language_style,
  auto_generate_images: Boolean(row.auto_generate_images),
  image_generation_options: row.image_generation_options_json ? JSON.parse(row.image_generation_options_json) : null,
  created: row.created,
  modified: row.modified,
  status: row.status,
});

const authCookieName = "auth";
const authSessionHours = 24;
const cookieMaxAgeMs = authSessionHours * 60 * 60 * 1000;

const parseCookies = (cookieHeader) => {
  if (!cookieHeader || typeof cookieHeader !== "string") return {};
  return cookieHeader.split(";").reduce((acc, pair) => {
    const [rawKey, ...rest] = pair.split("=");
    const key = rawKey ? rawKey.trim() : "";
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("=").trim());
    return acc;
  }, {});
};

const clearExpiredSessions = () => {
  db.prepare(`DELETE FROM auth_sessions WHERE expires_at <= ?`).run(new Date().toISOString());
};

const getAuthenticatedUser = (req) => {
  clearExpiredSessions();
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies[authCookieName];
  if (!sessionId) return null;
  return (
    db
      .prepare(
        `
    SELECT users.id, users.email, users.name
    FROM auth_sessions
    JOIN users ON users.id = auth_sessions.user_id
    WHERE auth_sessions.id = ? AND auth_sessions.expires_at > ?
  `,
      )
      .get(sessionId, new Date().toISOString()) || null
  );
};

const orderByToSql = (orderBy) => {
  switch (orderBy) {
    case "title":
      return "title ASC";
    case "-title":
      return "title DESC";
    case "modified":
      return "modified ASC";
    case "-modified":
      return "modified DESC";
    case "created":
      return "created ASC";
    case "-created":
    default:
      return "created DESC";
  }
};

const titleFromQuery = (query) => {
  const words = String(query).trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 5).join(" ") || "Untitled";
};

const scheduleDocumentProcessingComplete = (documentId) => {
  setTimeout(() => {
    try {
      db.prepare(
        `
        UPDATE documents
        SET status = ?, modified = ?
        WHERE id = ? AND status = ?
      `,
      ).run("ready", new Date().toISOString(), documentId, "pending");
    } catch (error) {
      console.error("Failed to finalize document processing:", error);
    }
  }, 20_000);
};

const registerDocumentRoutes = (basePath) => {
  app.post(basePath, (req, res) => {
    try {
      const body = req.body || {};
      const { language_style = "plain", auto_generate_images = false, image_generation_options = null } = body;

      // `files` is optional (omit, null, or []); when set it must be an array of upload IDs.
      if (body.files != null && !Array.isArray(body.files)) {
        return res.status(400).json({ error: "`files` is optional; when provided it must be an array of upload IDs." });
      }

      const files = Array.isArray(body.files) ? body.files : [];

      const hasQuery = typeof body.query === "string" && body.query.trim().length > 0;
      if (!hasQuery && files.length === 0) {
        return res.status(400).json({ error: "Provide at least one of `query` or `files`." });
      }

      if (!allowedLanguageStyles.has(language_style)) {
        return res.status(400).json({ error: "`language_style` must be one of: plain, easyread." });
      }

      if (files.length > 0) {
        const placeholders = files.map(() => "?").join(", ");
        const existing = db.prepare(`SELECT id FROM uploads WHERE id IN (${placeholders})`).all(...files);
        const existingIds = new Set(existing.map((row) => row.id));
        const unknownFileIds = files.filter((id) => !existingIds.has(id));
        if (unknownFileIds.length > 0) {
          return res.status(400).json({
            error: "Some file IDs do not exist. Upload files via /api/upload first.",
            invalid_file_ids: unknownFileIds,
          });
        }
      }

      const now = new Date().toISOString();
      const docId = uuidv4();
      let docTitle = "Untitled";
      if (typeof body.query === "string" && body.query.trim()) {
        docTitle = titleFromQuery(body.query);
      } else if (files.length > 0) {
        const firstUpload = db.prepare(`SELECT original_name FROM uploads WHERE id = ?`).get(files[0]);
        docTitle = firstUpload?.original_name || "Untitled";
      }

      db.prepare(
        `
        INSERT INTO documents (
          id, title, files_json, language_style, auto_generate_images,
          image_generation_options_json, created, modified, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ).run(
        docId,
        docTitle,
        JSON.stringify(files),
        language_style,
        auto_generate_images ? 1 : 0,
        image_generation_options ? JSON.stringify(image_generation_options) : null,
        now,
        now,
        "pending",
      );

      // Every new document gets the full mock section set.
      ensureSectionsForDocument(docId, true);
      scheduleDocumentProcessingComplete(docId);

      return res.status(202).json(docId);
    } catch (error) {
      return res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.get(basePath, (req, res) => {
    try {
      const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
      const page = Math.max(parseInt(req.query.page, 10) || defaultPage, 1);
      const pageSize = Math.max(parseInt(req.query.page_size, 10) || defaultPageSize, 1);
      const orderBy = typeof req.query.order_by === "string" ? req.query.order_by : "-created";
      const safeOrderBy = allowedOrderBy.has(orderBy) ? orderBy : "-created";
      const sortSql = orderByToSql(safeOrderBy);
      const offset = (page - 1) * pageSize;

      console.log(pageSize);

      const rows = db
        .prepare(
          `
        SELECT id, title, created, status
        FROM documents
        WHERE (? = '' OR LOWER(title) LIKE '%' || LOWER(?) || '%')
        ORDER BY ${sortSql}
        LIMIT ? OFFSET ?
      `,
        )
        .all(search, search, pageSize, offset);

      return res.status(200).json(rows);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.get(`${basePath}/:id`, (req, res) => {
    try {
      const row = db.prepare(`SELECT * FROM documents WHERE id = ?`).get(req.params.id);
      if (!row) return res.status(404).json({ error: "Document not found" });
      return res.status(200).json(parseDoc(row));
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  app.patch(`${basePath}/:id`, (req, res) => {
    try {
      const { title } = req.body || {};
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "`title` is required and must be a non-empty string." });
      }

      const result = db
        .prepare(
          `
        UPDATE documents
        SET title = ?, modified = ?
        WHERE id = ?
      `,
        )
        .run(title.trim(), new Date().toISOString(), req.params.id);

      if (result.changes === 0) return res.status(404).json({ error: "Document not found" });
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to update document" });
    }
  });

  app.delete(`${basePath}/:id`, (req, res) => {
    try {
      const result = db.prepare(`DELETE FROM documents WHERE id = ?`).run(req.params.id);
      if (result.changes === 0) return res.status(404).json({ error: "Document not found" });
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete document" });
    }
  });
};

registerDocumentRoutes("/api/documents");

const listSectionsHandler = (req, res) => {
  try {
    const doc = db.prepare(`SELECT id FROM documents WHERE id = ?`).get(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const rows = db
      .prepare(
        `
      SELECT id
      FROM sections
      WHERE document_id = ?
      ORDER BY sort_order ASC, created ASC
    `,
      )
      .all(req.params.id);

    return res.status(200).json(rows.map((row) => row.id));
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch sections" });
  }
};

const createSectionHandler = (req, res) => {
  try {
    const doc = db.prepare(`SELECT id FROM documents WHERE id = ?`).get(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const maxRow = db
      .prepare(`SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM sections WHERE document_id = ?`)
      .get(req.params.id);
    const now = new Date().toISOString();
    const sectionId = uuidv4();
    db.prepare(
      `
      INSERT INTO sections (id, document_id, text, image, sort_order, created, modified)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(sectionId, req.params.id, "", null, maxRow.max_sort + 1, now, now);

    return res.status(201).json(sectionId);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create section" });
  }
};

const reorderSectionsHandler = (req, res) => {
  try {
    const doc = db.prepare(`SELECT id FROM documents WHERE id = ?`).get(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const { target, after, before } = req.body || {};
    if (!target || typeof target !== "string") {
      return res.status(400).json({ error: "`target` section ID is required." });
    }
    if (after && before) {
      return res.status(400).json({ error: "Provide only one of `after` or `before`." });
    }

    const rows = db
      .prepare(
        `
      SELECT id
      FROM sections
      WHERE document_id = ?
      ORDER BY sort_order ASC, created ASC
    `,
      )
      .all(req.params.id);
    const ordered = rows.map((row) => row.id);
    const targetIndex = ordered.indexOf(target);
    if (targetIndex === -1) return res.status(404).json({ error: "Target section not found in document" });

    const withoutTarget = ordered.filter((id) => id !== target);
    let insertIndex = withoutTarget.length;
    if (before !== undefined) {
      if (before === null) {
        insertIndex = 0;
      } else {
        const beforeIndex = withoutTarget.indexOf(before);
        if (beforeIndex === -1) return res.status(404).json({ error: "`before` section not found in document" });
        insertIndex = beforeIndex;
      }
    } else if (after !== undefined) {
      if (after === null) {
        insertIndex = withoutTarget.length;
      } else {
        const afterIndex = withoutTarget.indexOf(after);
        if (afterIndex === -1) return res.status(404).json({ error: "`after` section not found in document" });
        insertIndex = afterIndex + 1;
      }
    }

    withoutTarget.splice(insertIndex, 0, target);
    const now = new Date().toISOString();
    const updateOrder = db.prepare(`UPDATE sections SET sort_order = ?, modified = ? WHERE id = ?`);
    const applyOrder = db.transaction((ids) => {
      ids.forEach((id, idx) => updateOrder.run(idx + 1, now, id));
    });
    applyOrder(withoutTarget);

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to reorder sections" });
  }
};

app.get("/api/documents/:id/sections", listSectionsHandler);
app.post("/api/documents/:id/sections", createSectionHandler);
app.post("/api/documents/:id/sections/reorder", reorderSectionsHandler);

app.get("/api/sections/:id", (req, res) => {
  try {
    const row = db
      .prepare(
        `
      SELECT id, document_id, text, image, sort_order, created, modified
      FROM sections
      WHERE id = ?
    `,
      )
      .get(req.params.id);
    if (!row) return res.status(404).json({ error: "Section not found" });
    return res.status(200).json(row);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch section" });
  }
});

app.patch("/api/sections/:id", (req, res) => {
  try {
    const { text, image } = req.body || {};
    const existing = db.prepare(`SELECT id FROM sections WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Section not found" });
    if (text === undefined && image === undefined) {
      return res.status(400).json({ error: "Provide at least one of `text` or `image`." });
    }

    const updates = [];
    const params = [];
    if (text !== undefined) {
      if (typeof text !== "string") return res.status(400).json({ error: "`text` must be a string." });
      updates.push("text = ?");
      params.push(text);
    }
    if (image !== undefined) {
      if (image !== null && typeof image !== "string")
        return res.status(400).json({ error: "`image` must be a string or null." });
      updates.push("image = ?");
      params.push(image);
    }
    updates.push("modified = ?");
    params.push(new Date().toISOString());
    params.push(req.params.id);

    db.prepare(`UPDATE sections SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update section" });
  }
});

app.delete("/api/sections/:id", (req, res) => {
  try {
    const section = db.prepare(`SELECT id, document_id FROM sections WHERE id = ?`).get(req.params.id);
    if (!section) return res.status(404).json({ error: "Section not found" });

    const remove = db.transaction(() => {
      db.prepare(`DELETE FROM sections WHERE id = ?`).run(req.params.id);
      const remaining = db
        .prepare(
          `
        SELECT id
        FROM sections
        WHERE document_id = ?
        ORDER BY sort_order ASC, created ASC
      `,
        )
        .all(section.document_id);
      const updateOrder = db.prepare(`UPDATE sections SET sort_order = ? WHERE id = ?`);
      remaining.forEach((row, idx) => updateOrder.run(idx + 1, row.id));
    });
    remove();

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete section" });
  }
});

app.get("/api/sections/:id/candidates", (req, res) => {
  try {
    const section = db.prepare(`SELECT id FROM sections WHERE id = ?`).get(req.params.id);
    if (!section) return res.status(404).json({ error: "Section not found" });

    const rows = db
      .prepare(
        `
      SELECT COALESCE(image_url, id) AS candidate
      FROM section_candidates
      WHERE section_id = ?
      ORDER BY created_at ASC
    `,
      )
      .all(req.params.id);

    return res.status(200).json(rows.map((row) => row.candidate));
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch candidate images" });
  }
});

app.post("/api/sections/:id/candidates", (req, res) => {
  try {
    const section = db.prepare(`SELECT id, image FROM sections WHERE id = ?`).get(req.params.id);
    if (!section) return res.status(404).json({ error: "Section not found" });

    const payload = req.body || {};
    const prompt = typeof payload.prompt === "string" ? payload.prompt : null;
    const now = new Date().toISOString();
    const candidateUrls = [section.image, ...candidatePlaceholders];
    const newIds = candidateUrls.map(() => uuidv4());
    const insertCandidate = db.prepare(`
      INSERT INTO section_candidates (id, section_id, prompt, options_json, created_at, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const optionsJson = JSON.stringify(payload);
    const insertMany = db.transaction((ids) => {
      ids.forEach((id, idx) => {
        insertCandidate.run(id, req.params.id, prompt, optionsJson, now, candidateUrls[idx]);
      });
    });
    insertMany(newIds);

    // Frontend typically uses these values as image URLs (mock behavior).
    return res.status(200).json(candidateUrls);
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate candidate images" });
  }
});

/**
 * POST /api/upload
 * Handles multipart/form-data
 */
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileId = uuidv4();
    const previewUrl = `/previews/${fileId}.pdf`;

    const response = {
      id: fileId,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype || "application/octet-stream",
      size: req.file.size,
      previewUrl: previewUrl,
      createdAt: new Date().toISOString(),
    };

    db.prepare(
      `
      INSERT INTO uploads (id, original_name, mime_type, size, preview_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    ).run(
      response.id,
      response.originalName,
      response.mimeType,
      response.size,
      response.previewUrl,
      response.createdAt,
    );

    res.status(201).json(response);
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "`email` and `password` are required." });
    }

    const user = db
      .prepare(
        `
      SELECT id, email, name, password
      FROM users
      WHERE LOWER(email) = LOWER(?)
    `,
      )
      .get(email.trim());
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + cookieMaxAgeMs);
    const sessionId = uuidv4();

    db.prepare(
      `
      INSERT INTO auth_sessions (id, user_id, created_at, expires_at)
      VALUES (?, ?, ?, ?)
    `,
    ).run(sessionId, user.id, now.toISOString(), expiresAt.toISOString());

    res.cookie(authCookieName, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: cookieMaxAgeMs,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to login." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies[authCookieName];
    if (sessionId) {
      db.prepare(`DELETE FROM auth_sessions WHERE id = ?`).run(sessionId);
    }
    res.clearCookie(authCookieName, { httpOnly: true, sameSite: "lax" });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to logout." });
  }
});

app.get("/api/auth/session", (req, res) => {
  try {
    const user = getAuthenticatedUser(req);
    return res.status(200).json({ isAuthenticated: Boolean(user) });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch session." });
  }
});

app.get("/api/users/me", (req, res) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch current user." });
  }
});

const PORT = 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
