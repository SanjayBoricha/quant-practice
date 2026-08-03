<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  chapter: { type: Object, required: true },
  hardQuestions: { type: Array, default: () => [] },
});

const emit = defineEmits([
  "increment",
  "decrement",
  "set-count",
  "delete-chapter",
  "add-hard-question",
  "toggle-resolved",
  "delete-hard-question",
  "drag-start",
  "drag-end",
]);

const showHard = ref(false);
const newQNumber = ref("");
const newQNote = ref("");

const pendingHard = computed(() => props.hardQuestions.filter((h) => !h.resolved));
const resolvedHard = computed(() => props.hardQuestions.filter((h) => h.resolved));

function submitCount(e) {
  emit("set-count", e.target.value);
}

function submitHardQuestion() {
  emit("add-hard-question", { questionNumber: newQNumber.value, note: newQNote.value });
  newQNumber.value = "";
  newQNote.value = "";
}
</script>

<template>
  <div class="card chapter-card h-100 p-3">
    <div class="d-flex justify-content-between align-items-start mb-2">
      <div class="d-flex align-items-center gap-2 pe-2">
        <i
          class="bi bi-grip-vertical drag-handle"
          title="Drag to reorder"
          draggable="true"
          @dragstart="$emit('drag-start', $event)"
          @dragend="$emit('drag-end', $event)"
        ></i>
        <h5 class="fw-bold mb-0">{{ chapter.name }}</h5>
      </div>
      <button class="btn btn-sm btn-link text-danger p-0" title="Delete chapter" @click="$emit('delete-chapter')">
        <i class="bi bi-trash"></i>
      </button>
    </div>

    <div class="d-flex align-items-center gap-3 mb-3">
      <div>
        <div class="d-flex align-items-baseline gap-2">
          <button class="btn btn-outline-secondary counter-btn" @click="$emit('decrement')">−</button>
          <input
            type="number"
            class="form-control text-center fw-bold"
            style="width: 80px"
            :value="chapter.completedCount"
            min="0"
            @change="submitCount"
          />
          <button class="btn btn-outline-secondary counter-btn" @click="$emit('increment')">+</button>
        </div>
        <div class="small text-muted mt-1">questions completed</div>
      </div>
    </div>

    <div class="d-flex justify-content-between align-items-center">
      <span class="chip bg-light text-secondary border">
        <i class="bi bi-exclamation-triangle-fill text-danger me-1" v-if="pendingHard.length"></i>
        {{ pendingHard.length }} to revise
      </span>
      <button class="btn btn-sm btn-outline-primary" @click="showHard = !showHard">
        <i class="bi bi-bookmark-star me-1"></i>{{ showHard ? "Hide" : "Manage" }}
      </button>
    </div>

    <transition name="fade">
      <div v-if="showHard" class="mt-3 border-top pt-3">
        <form class="row g-2 mb-2" @submit.prevent="submitHardQuestion">
          <div class="col-4">
            <input v-model="newQNumber" type="text" class="form-control form-control-sm" placeholder="Q. no" />
          </div>
          <div class="col-6">
            <input v-model="newQNote" type="text" class="form-control form-control-sm" placeholder="Note (optional)" />
          </div>
          <div class="col-2">
            <button class="btn btn-brand btn-sm w-100" type="submit" :disabled="!newQNumber.trim()">
              <i class="bi bi-plus-lg"></i>
            </button>
          </div>
        </form>

        <div v-if="pendingHard.length === 0 && resolvedHard.length === 0" class="text-muted small">
          No hard questions flagged yet.
        </div>

        <div class="d-flex flex-wrap gap-2">
          <span
            v-for="q in pendingHard"
            :key="q.id"
            class="hard-q-pill px-2 py-1 d-inline-flex align-items-center gap-2"
            :title="q.note"
          >
            #{{ q.questionNumber }}
            <i class="bi bi-check-circle" role="button" title="Mark revised" @click="$emit('toggle-resolved', q)"></i>
            <i class="bi bi-x-lg" role="button" title="Remove" @click="$emit('delete-hard-question', q)"></i>
          </span>
          <span
            v-for="q in resolvedHard"
            :key="q.id"
            class="hard-q-pill resolved px-2 py-1 d-inline-flex align-items-center gap-2"
            :title="q.note"
          >
            #{{ q.questionNumber }}
            <i class="bi bi-arrow-counterclockwise" role="button" title="Mark unresolved" @click="$emit('toggle-resolved', q)"></i>
            <i class="bi bi-x-lg" role="button" title="Remove" @click="$emit('delete-hard-question', q)"></i>
          </span>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.drag-handle {
  cursor: grab;
  color: #b7b3d6;
  font-size: 1.1rem;
}

.drag-handle:active {
  cursor: grabbing;
}
</style>
