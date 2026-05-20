import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { ForumDB, Tugas, Jawaban, Komentar } from "./src/types.js";

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "forum_db.json");

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Helper to load DB
function loadDB(): ForumDB {
  const currentYear = new Date().getFullYear();
  if (!fs.existsSync(DB_FILE)) {
    const initialDB: ForumDB = {
      tugas: [],
      jawaban: [],
      lastYear: currentYear,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), "utf-8");
    return initialDB;
  }
  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    const db = JSON.parse(content) as ForumDB;
    // Ensure arrays exist
    if (!db.tugas) db.tugas = [];
    if (!db.jawaban) db.jawaban = [];
    if (!db.lastYear) db.lastYear = currentYear;
    return db;
  } catch (err) {
    console.error("Failed to parse DB, resetting", err);
    return { tugas: [], jawaban: [], lastYear: currentYear };
  }
}

// Helper to save DB
function saveDB(db: ForumDB) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

// Admin checking middleware
const ADMIN_TOKEN = "admin-authorized-token-112233_ti2bb";

function checkAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers["x-admin-token"];
  if (token === ADMIN_TOKEN) {
    next();
  } else {
    res.status(401).json({ error: "Akses ditolak. Silakan login sebagai Admin terlebih dahulu." });
  }
}

async function startServer() {
  const app = express();

  // Support large uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Serve uploads statically
  app.use("/data/uploads", express.static(UPLOADS_DIR));

  // Annual Auto-Reset Middleware (Kapasitas Memori)
  // Check the system year on every API request
  app.use("/api", (req, res, next) => {
    const db = loadDB();
    const currentYear = new Date().getFullYear();

    if (currentYear > db.lastYear) {
      console.log(`[ANNUAL RESET] Resetting discussion forum data for transition from year ${db.lastYear} to ${currentYear}...`);
      
      // Delete all uploaded files
      try {
        const files = fs.readdirSync(UPLOADS_DIR);
        for (const file of files) {
          fs.unlinkSync(path.join(UPLOADS_DIR, file));
        }
      } catch (err) {
        console.error("Error clearing upload files during reset:", err);
      }

      // Reset DB
      db.tugas = [];
      db.jawaban = [];
      db.lastYear = currentYear;
      saveDB(db);
    }
    next();
  });

  // API Route: Login
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    if (username === "adminn" && password === "112233_ti2bb") {
      res.json({ success: true, token: ADMIN_TOKEN });
    } else {
      res.status(401).json({ success: false, error: "Username atau Password salah." });
    }
  });

  // API Route: Get all forum data
  app.get("/api/forum", (req, res) => {
    const db = loadDB();
    res.json({ tugas: db.tugas, jawaban: db.jawaban });
  });

  // API Route: Register Task (Admin Only)
  app.post("/api/tugas", checkAdminAuth, (req, res) => {
    const { judul, deskripsi, fileData, fileName, fileMime } = req.body;
    
    if (!judul || !deskripsi) {
      return res.status(400).json({ error: "Judul dan deskripsi wajib diisi." });
    }

    let fileUrl: string | null = null;
    let finalFileName: string | null = null;
    let finalFileType: string | null = null;

    if (fileData && fileName) {
      try {
        // fileData is a Base64 string e.g., "data:image/jpeg;base64,..."
        const parts = fileData.split(";base64,");
        const b64 = parts[1] || parts[0];
        const buffer = Buffer.from(b64, "base64");
        
        const timestamp = Date.now();
        const cleanedName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const storedName = `${timestamp}_${cleanedName}`;
        
        fs.writeFileSync(path.join(UPLOADS_DIR, storedName), buffer);
        fileUrl = `/data/uploads/${storedName}`;
        finalFileName = fileName;
        finalFileType = fileMime || (fileName.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
      } catch (err) {
        console.error("Failed to save attachment for task", err);
        return res.status(500).json({ error: "Gagal menyimpan lampiran file." });
      }
    }

    const db = loadDB();
    const newTask: Tugas = {
      id: `tugas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      judul,
      deskripsi,
      fileUrl,
      fileName: finalFileName,
      fileType: finalFileType,
      createdAt: new Date().toISOString(),
      komentar: [],
    };

    db.tugas.unshift(newTask); // Newest first
    saveDB(db);

    res.status(201).json(newTask);
  });

  // API Route: Post Answer (Open to all)
  app.post("/api/jawaban", (req, res) => {
    const { judul, deskripsi, namaPengirim, fileData, fileName, fileMime } = req.body;
    
    if (!judul || !deskripsi) {
      return res.status(400).json({ error: "Judul dan deskripsi wajib diisi." });
    }
    if (!fileData || !fileName) {
      return res.status(400).json({ error: "Upload lampiran file (PDF atau Foto) wajib diisi." });
    }

    let fileUrl = "";
    let finalFileName = "";
    let finalFileType = "";

    try {
      const parts = fileData.split(";base64,");
      const b64 = parts[1] || parts[0];
      const buffer = Buffer.from(b64, "base64");
      
      const timestamp = Date.now();
      const cleanedName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const storedName = `${timestamp}_${cleanedName}`;
      
      fs.writeFileSync(path.join(UPLOADS_DIR, storedName), buffer);
      fileUrl = `/data/uploads/${storedName}`;
      finalFileName = fileName;
      finalFileType = fileMime || (fileName.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
    } catch (err) {
      console.error("Failed to save attachment for answer", err);
      return res.status(500).json({ error: "Gagal menyimpan lampiran jawaban." });
    }

    const db = loadDB();
    const newAnswer: Jawaban = {
      id: `jawaban-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      judul,
      deskripsi,
      namaPengirim: (namaPengirim && namaPengirim.trim()) ? namaPengirim.trim() : "Anonim",
      fileUrl,
      fileName: finalFileName,
      fileType: finalFileType,
      createdAt: new Date().toISOString(),
      komentar: [],
    };

    db.jawaban.unshift(newAnswer); // Newest first
    saveDB(db);

    res.status(201).json(newAnswer);
  });

  // API Route: Add Comment to Task (Open to all)
  app.post("/api/tugas/:id/komentar", (req, res) => {
    const { id } = req.params;
    const { nama, teks } = req.body;

    if (!teks || !teks.trim()) {
      return res.status(400).json({ error: "Teks komentar wajib diisi." });
    }

    const db = loadDB();
    const taskIndex = db.tugas.findIndex((t) => t.id === id);

    if (taskIndex === -1) {
      return res.status(404).json({ error: "Tugas tidak ditemukan." });
    }

    const newComment: Komentar = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nama: (nama && nama.trim()) ? nama.trim() : "Anonim",
      teks: teks.trim(),
      createdAt: new Date().toISOString(),
    };

    db.tugas[taskIndex].komentar.push(newComment); // Append comments chronologically (oldest to newest)
    saveDB(db);

    res.status(201).json(newComment);
  });

  // API Route: Add Comment to Answer (Open to all)
  app.post("/api/jawaban/:id/komentar", (req, res) => {
    const { id } = req.params;
    const { nama, teks } = req.body;

    if (!teks || !teks.trim()) {
      return res.status(400).json({ error: "Teks komentar wajib diisi." });
    }

    const db = loadDB();
    const answerIndex = db.jawaban.findIndex((j) => j.id === id);

    if (answerIndex === -1) {
      return res.status(404).json({ error: "Jawaban tidak ditemukan." });
    }

    const newComment: Komentar = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nama: (nama && nama.trim()) ? nama.trim() : "Anonim",
      teks: teks.trim(),
      createdAt: new Date().toISOString(),
    };

    db.jawaban[answerIndex].komentar.push(newComment);
    saveDB(db);

    res.status(201).json(newComment);
  });

  // API Route: Delete Task (Admin Only)
  app.delete("/api/tugas/:id", checkAdminAuth, (req, res) => {
    const { id } = req.params;
    const db = loadDB();
    
    const task = db.tugas.find((t) => t.id === id);
    if (!task) {
      return res.status(404).json({ error: "Tugas tidak ditemukan." });
    }

    // Delete associated upload if exists
    if (task.fileUrl) {
      const filename = path.basename(task.fileUrl);
      const filePath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error("Failed to delete static file", filePath, e);
        }
      }
    }

    db.tugas = db.tugas.filter((t) => t.id !== id);
    saveDB(db);

    res.json({ success: true, message: "Tugas berhasil dihapus." });
  });

  // API Route: Delete Answer (Admin Only)
  app.delete("/api/jawaban/:id", checkAdminAuth, (req, res) => {
    const { id } = req.params;
    const db = loadDB();

    const answer = db.jawaban.find((j) => j.id === id);
    if (!answer) {
      return res.status(404).json({ error: "Jawaban tidak ditemukan." });
    }

    // Delete associated upload
    if (answer.fileUrl) {
      const filename = path.basename(answer.fileUrl);
      const filePath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error("Failed to delete static file", filePath, e);
        }
      }
    }

    db.jawaban = db.jawaban.filter((j) => j.id !== id);
    saveDB(db);

    res.json({ success: true, message: "Jawaban berhasil dihapus." });
  });

  // API Route: Delete Comment from Task (Admin Only)
  app.delete("/api/tugas/:tugasId/komentar/:komentarId", checkAdminAuth, (req, res) => {
    const { tugasId, komentarId } = req.params;
    const db = loadDB();

    const taskIndex = db.tugas.findIndex((t) => t.id === tugasId);
    if (taskIndex === -1) {
      return res.status(404).json({ error: "Tugas tidak ditemukan." });
    }

    const task = db.tugas[taskIndex];
    task.komentar = task.komentar.filter((k) => k.id !== komentarId);
    db.tugas[taskIndex] = task;
    saveDB(db);

    res.json({ success: true, message: "Komentar tugas berhasil dihapus." });
  });

  // API Route: Delete Comment from Answer (Admin Only)
  app.delete("/api/jawaban/:jawabanId/komentar/:komentarId", checkAdminAuth, (req, res) => {
    const { jawabanId, komentarId } = req.params;
    const db = loadDB();

    const answerIndex = db.jawaban.findIndex((j) => j.id === jawabanId);
    if (answerIndex === -1) {
      return res.status(404).json({ error: "Jawaban tidak ditemukan." });
    }

    const answer = db.jawaban[answerIndex];
    answer.komentar = answer.komentar.filter((k) => k.id !== komentarId);
    db.jawaban[answerIndex] = answer;
    saveDB(db);

    res.json({ success: true, message: "Komentar jawaban berhasil dihapus." });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
