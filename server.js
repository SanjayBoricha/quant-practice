import express from "express";
import cors from "cors";
import { connectDB, disconnectDB } from "./db/index.js";
import { Chapter, HardQuestion } from "./db/schema.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
await connectDB();

const DEFAULT_CHAPTERS = [
  "Percentage",
  "Ratio & Proportion",
  "Mixture & Allegation",
  "Partnership",
  "Ages",
  "Average",
  "Profit Loss Discount",
  "SI & CI",
  "Time Speed Distance",
  "Boats & Streams",
  "Time & Work",
  "Pipes & Cisterns",
  "Data Interpretation",
  "Number System",
  "Simplification",
  "Algebra",
  "Trigonometry",
  "Height & Distance",
  "Geometry",
  "Mensuration",
];

// Seed chapters if empty
async function ensureSeeded() {
  const count = await Chapter.countDocuments();
  if (count === 0) {
    const chapters = DEFAULT_CHAPTERS.map((name, i) => ({
      name,
      sortOrder: i,
      completedCount: 0,
    }));
    await Chapter.insertMany(chapters);
    console.log("Database seeded with default chapters");
  }
}

// ============ CHAPTERS ROUTES ============

// GET /api/chapters
app.get("/api/chapters", async (req, res) => {
  try {
    await ensureSeeded();
    const chapters = await Chapter.find().sort({ sortOrder: 1, _id: 1 });
    res.json(
      chapters.map((ch) => ({
        id: ch._id.toString(),
        name: ch.name,
        completedCount: ch.completedCount,
        sortOrder: ch.sortOrder,
        createdAt: ch.createdAt,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/chapters (Create new chapter)
app.post("/api/chapters", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name required" });
    }

    const chapters = await Chapter.find();
    const maxSort = chapters.reduce((m, c) => Math.max(m, c.sortOrder), -1);

    const chapter = new Chapter({
      name: name.trim(),
      sortOrder: maxSort + 1,
      completedCount: 0,
    });

    await chapter.save();
    res.status(201).json({
      id: chapter._id.toString(),
      name: chapter.name,
      completedCount: chapter.completedCount,
      sortOrder: chapter.sortOrder,
      createdAt: chapter.createdAt,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Chapter already exists" });
    }
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/chapters (Update chapter)
app.patch("/api/chapters", async (req, res) => {
  try {
    const { id, completedCount, name, sortOrder } = req.body;
    if (!id) {
      return res.status(400).json({ error: "id required" });
    }

    const updates = {};
    if (typeof completedCount === "number") {
      updates.completedCount = Math.max(0, completedCount);
    }
    if (typeof name === "string" && name.trim()) {
      updates.name = name.trim();
    }
    if (typeof sortOrder === "number") {
      updates.sortOrder = sortOrder;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const chapter = await Chapter.findByIdAndUpdate(id, updates, { new: true });
    if (!chapter) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({
      id: chapter._id.toString(),
      name: chapter.name,
      completedCount: chapter.completedCount,
      sortOrder: chapter.sortOrder,
      createdAt: chapter.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/chapters
app.delete("/api/chapters", async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: "id required" });
    }

    await HardQuestion.deleteMany({ chapterId: id });
    await Chapter.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ HARD QUESTIONS ROUTES ============

// GET /api/hard-questions
app.get("/api/hard-questions", async (req, res) => {
  try {
    const { chapterId } = req.query;
    let query = HardQuestion.find();

    if (chapterId) {
      query = query.where("chapterId", chapterId);
    }

    const questions = await query.sort({ _id: 1 });
    res.json(
      questions.map((q) => ({
        id: q._id.toString(),
        chapterId: q.chapterId.toString(),
        questionNumber: q.questionNumber,
        note: q.note,
        resolved: q.resolved,
        createdAt: q.createdAt,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/hard-questions (Create new hard question)
app.post("/api/hard-questions", async (req, res) => {
  try {
    const { chapterId, questionNumber, note } = req.body;

    if (!chapterId || !questionNumber) {
      return res.status(400).json({ error: "chapterId and questionNumber required" });
    }

    const question = new HardQuestion({
      chapterId,
      questionNumber: questionNumber.trim(),
      note: (note || "").trim(),
      resolved: false,
    });

    await question.save();
    res.status(201).json({
      id: question._id.toString(),
      chapterId: question.chapterId.toString(),
      questionNumber: question.questionNumber,
      note: question.note,
      resolved: question.resolved,
      createdAt: question.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/hard-questions (Update hard question)
app.patch("/api/hard-questions", async (req, res) => {
  try {
    const { id, resolved, note, questionNumber } = req.body;

    if (!id) {
      return res.status(400).json({ error: "id required" });
    }

    const updates = {};
    if (typeof resolved === "boolean") {
      updates.resolved = resolved;
    }
    if (typeof note === "string") {
      updates.note = note.trim();
    }
    if (typeof questionNumber === "string" && questionNumber.trim()) {
      updates.questionNumber = questionNumber.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const question = await HardQuestion.findByIdAndUpdate(id, updates, { new: true });
    if (!question) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({
      id: question._id.toString(),
      chapterId: question.chapterId.toString(),
      questionNumber: question.questionNumber,
      note: question.note,
      resolved: question.resolved,
      createdAt: question.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/hard-questions
app.delete("/api/hard-questions", async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "id required" });
    }

    await HardQuestion.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  disconnectDB();
  process.exit(0);
});
