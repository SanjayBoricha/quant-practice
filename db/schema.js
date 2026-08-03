import mongoose from "mongoose";

// Chapter Schema
const chapterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  completedCount: {
    type: Number,
    default: 0,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hard Questions Schema
const hardQuestionSchema = new mongoose.Schema({
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chapter",
    required: true,
  },
  questionNumber: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    default: "",
  },
  resolved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Chapter = mongoose.model("Chapter", chapterSchema);
export const HardQuestion = mongoose.model("HardQuestion", hardQuestionSchema);
