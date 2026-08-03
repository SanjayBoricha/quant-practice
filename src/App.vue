<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import ChapterCard from "./components/ChapterCard.vue";

const chapters = ref([]);
const hardQuestions = ref([]);
const loading = ref(true);
const errorMsg = ref("");
const newChapterName = ref("");
const adding = ref(false);
const filter = ref("all"); // all | pending | done
const draggedChapterId = ref(null);
const dragOverChapterId = ref(null);
const chapterSaveTimers = new Map();

const API_BASE = import.meta.env.VITE_API_BASE || "";
const api = (path) => `${API_BASE}${path}`;

async function loadAll() {
  loading.value = true;
  errorMsg.value = "";
  try {
    const [chaptersRes, hqRes] = await Promise.all([
      fetch(api("/api/chapters")),
      fetch(api("/api/hard-questions")),
    ]);
    if (!chaptersRes.ok || !hqRes.ok) throw new Error("Failed to load data");
    chapters.value = await chaptersRes.json();
    hardQuestions.value = await hqRes.json();
  } catch (e) {
    errorMsg.value = "Could not load your data. Please refresh.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadAll);

onBeforeUnmount(() => {
  chapterSaveTimers.forEach((timer) => clearTimeout(timer));
  chapterSaveTimers.clear();
});

const totalCompleted = computed(() =>
  chapters.value.reduce((sum, c) => sum + c.completedCount, 0)
);

const totalHard = computed(
  () => hardQuestions.value.filter((h) => !h.resolved).length
);

const visibleChapters = computed(() => {
  if (filter.value === "all") return chapters.value;
  if (filter.value === "pending") return chapters.value.filter((c) => c.completedCount === 0);
  return chapters.value.filter((c) => c.completedCount > 0);
});

function hardQuestionsFor(chapterId) {
  return hardQuestions.value.filter((h) => h.chapterId === chapterId);
}

async function addChapter() {
  const name = newChapterName.value.trim();
  if (!name) return;
  adding.value = true;
  try {
    const res = await fetch(api("/api/chapters"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.status === 409) {
      errorMsg.value = "That chapter already exists.";
      return;
    }
    if (!res.ok) throw new Error("Failed");
    const created = await res.json();
    chapters.value.push(created);
    newChapterName.value = "";
  } catch (e) {
    errorMsg.value = "Could not add chapter.";
  } finally {
    adding.value = false;
  }
}

function scheduleChapterSave(chapter, completedCount) {
  const chapterId = chapter.id;
  const existingTimer = chapterSaveTimers.get(chapterId);
  if (existingTimer) clearTimeout(existingTimer);

  const timer = setTimeout(async () => {
    chapterSaveTimers.delete(chapterId);
    try {
      await fetch(api("/api/chapters"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: chapterId, completedCount }),
      });
    } catch (e) {
      errorMsg.value = "Could not save your progress.";
    }
  }, 300);

  chapterSaveTimers.set(chapterId, timer);
}

function updateCount(chapter, delta) {
  const next = Math.max(0, chapter.completedCount + delta);
  chapter.completedCount = next;
  scheduleChapterSave(chapter, next);
}

function setCount(chapter, value) {
  const next = Math.max(0, Number(value) || 0);
  chapter.completedCount = next;
  scheduleChapterSave(chapter, next);
}

async function deleteChapter(chapter) {
  if (!confirm(`Remove "${chapter.name}" and its hard questions?`)) return;
  chapters.value = chapters.value.filter((c) => c.id !== chapter.id);
  hardQuestions.value = hardQuestions.value.filter((h) => h.chapterId !== chapter.id);
  try {
    await fetch(api(`/api/chapters?id=${chapter.id}`), { method: "DELETE" });
  } catch (e) {
    errorMsg.value = "Could not delete chapter.";
  }
}

async function addHardQuestion(chapter, { questionNumber, note }) {
  if (!questionNumber.trim()) return;
  try {
    const res = await fetch(api("/api/hard-questions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId: chapter.id, questionNumber, note }),
    });
    if (!res.ok) throw new Error("Failed");
    const created = await res.json();
    hardQuestions.value.push(created);
  } catch (e) {
    errorMsg.value = "Could not save that question.";
  }
}

async function toggleResolved(question) {
  question.resolved = !question.resolved;
  try {
    await fetch(api("/api/hard-questions"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: question.id, resolved: question.resolved }),
    });
  } catch (e) {
    errorMsg.value = "Could not update that question.";
  }
}

async function deleteHardQuestion(question) {
  hardQuestions.value = hardQuestions.value.filter((h) => h.id !== question.id);
  try {
    await fetch(api(`/api/hard-questions?id=${question.id}`), { method: "DELETE" });
  } catch (e) {
    errorMsg.value = "Could not delete that question.";
  }
}

function onChapterDragStart(chapter) {
  draggedChapterId.value = chapter.id;
}

function onChapterDragEnd() {
  draggedChapterId.value = null;
  dragOverChapterId.value = null;
}

function onChapterDragEnter(chapter) {
  if (draggedChapterId.value === null || draggedChapterId.value === chapter.id) return;
  dragOverChapterId.value = chapter.id;
}

async function onChapterDrop(targetChapter) {
  const draggedId = draggedChapterId.value;
  dragOverChapterId.value = null;
  draggedChapterId.value = null;
  if (draggedId === null || draggedId === targetChapter.id) return;

  const list = chapters.value;
  const fromIndex = list.findIndex((c) => c.id === draggedId);
  const toIndex = list.findIndex((c) => c.id === targetChapter.id);
  if (fromIndex === -1 || toIndex === -1) return;

  const reordered = list.slice();
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);
  chapters.value = reordered;

  try {
    await Promise.all(
      reordered.map((c, i) =>
        fetch(api("/api/chapters"), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: c.id, sortOrder: i }),
        })
      )
    );
  } catch (e) {
    errorMsg.value = "Could not save the new chapter order.";
  }
}
</script>

<template>
  <div class="app-hero px-3 px-md-5 pt-5 pb-4 mb-4">
    <div class="container">
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
        <div>
          <span class="hero-badge chip d-inline-block mb-2"><i class="bi bi-stars me-1"></i>Quant Practice Tracker</span>
          <h1 class="fw-bold mb-1">Math Chapter Progress</h1>
          <p class="mb-0 opacity-90">Track questions completed per chapter and flag the tricky ones to revise later.</p>
        </div>
        <div class="d-flex gap-3">
          <div class="stat-tile px-4 py-3 text-center">
            <div class="fs-3 fw-bold">{{ totalCompleted }}</div>
            <div class="small opacity-90">Questions done</div>
          </div>
          <div class="stat-tile px-4 py-3 text-center">
            <div class="fs-3 fw-bold">{{ totalHard }}</div>
            <div class="small opacity-90">To revise</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="container pb-5">
    <div v-if="errorMsg" class="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
      <span>{{ errorMsg }}</span>
      <button class="btn-close" @click="errorMsg = ''"></button>
    </div>

    <div class="card chapter-card mb-4 p-3">
      <form class="row g-2 align-items-center" @submit.prevent="addChapter">
        <div class="col-12 col-md-8">
          <input
            v-model="newChapterName"
            type="text"
            class="form-control"
            placeholder="Add a new chapter, e.g. Permutation & Combination"
          />
        </div>
        <div class="col-6 col-md-2">
          <button type="submit" class="btn btn-brand w-100" :disabled="adding || !newChapterName.trim()">
            <i class="bi bi-plus-lg me-1"></i>Add
          </button>
        </div>
        <div class="col-6 col-md-2">
          <select v-model="filter" class="form-select">
            <option value="all">All chapters</option>
            <option value="pending">Not started</option>
            <option value="done">Started</option>
          </select>
        </div>
      </form>
    </div>

    <div v-if="loading" class="text-center py-5 text-muted">
      <div class="spinner-border text-primary mb-2" role="status"></div>
      <div>Loading your chapters...</div>
    </div>

    <div v-else-if="visibleChapters.length === 0" class="empty-state text-center py-5 text-muted">
      <i class="bi bi-emoji-smile fs-1 d-block mb-2"></i>
      No chapters to show here yet.
    </div>

    <div v-else class="row g-4">
      <div
        v-for="chapter in visibleChapters"
        :key="chapter.id"
        class="col-12 col-md-6 col-lg-4 chapter-drag-col"
        :class="{ dragging: draggedChapterId === chapter.id, 'drag-over': dragOverChapterId === chapter.id }"
        @dragover.prevent
        @dragenter.prevent="onChapterDragEnter(chapter)"
        @drop.prevent="onChapterDrop(chapter)"
      >
        <ChapterCard
          :chapter="chapter"
          :hard-questions="hardQuestionsFor(chapter.id)"
          @increment="updateCount(chapter, 1)"
          @decrement="updateCount(chapter, -1)"
          @set-count="(v) => setCount(chapter, v)"
          @delete-chapter="deleteChapter(chapter)"
          @add-hard-question="(p) => addHardQuestion(chapter, p)"
          @toggle-resolved="toggleResolved"
          @delete-hard-question="deleteHardQuestion"
          @drag-start="onChapterDragStart(chapter)"
          @drag-end="onChapterDragEnd"
        />
      </div>
    </div>
  </div>
</template>
