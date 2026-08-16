<template>
  <div
    v-if="showEditModal"
    class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
  >
    <div
      class="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
    >
      <!-- Header Modal -->
      <div
        class="bg-slate-900 text-white p-5 flex items-center justify-between"
      >
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-sm">Edit COA & Deskripsi Transaksi</h3>
            <span
              class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
              :class="
                editForm.type === 'pengeluaran'
                  ? 'bg-amber-400/20 text-amber-300'
                  : 'bg-emerald-400/20 text-emerald-300'
              "
            >
              {{ editForm.type }}
            </span>
          </div>
          <p class="text-[11px] text-slate-400 mt-0.5">
            Sesuaikan akun pembebanan dan uraian jurnal sesuai kebutuhan
          </p>
        </div>
        <button
          @click="showEditModal = false"
          class="text-slate-400 hover:text-white font-bold p-1"
        >
          ✕
        </button>
      </div>

      <!-- Body Modal -->
      <div class="p-6 space-y-4 text-xs overflow-y-auto flex-grow">
        <!-- 1. Edit Uraian / Deskripsi -->
        <div class="space-y-1">
          <label class="font-bold text-slate-700 block"
            >Uraian / Deskripsi Jurnal:</label
          >
          <textarea
            v-model="editForm.uraian"
            rows="2"
            class="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold bg-slate-50 outline-none focus:border-emerald-600 focus:bg-white transition"
            placeholder="Masukkan keterangan transaksi..."
          ></textarea>
        </div>

        <!-- 2. COA Aktif Terpilih -->
        <div class="space-y-1">
          <label class="font-bold text-slate-700 block"
            >COA Terpilih Saat Ini:</label
          >
          <div
            class="bg-emerald-50/80 border border-emerald-200/80 p-3 rounded-xl flex items-center justify-between"
          >
            <div>
              <span
                class="font-mono font-bold text-emerald-950 text-xs block"
                >{{ editForm.selectedKode }}</span
              >
              <span class="text-emerald-900 font-medium text-[11px]">{{
                editForm.selectedNama
              }}</span>
            </div>
            <span class="text-emerald-600 text-sm font-bold">✓</span>
          </div>
        </div>

        <!-- 3. Pencarian & Pemilihan COA Baru -->
        <div class="space-y-2 pt-2 border-t border-slate-100">
          <div class="flex items-center justify-between">
            <label class="font-bold text-slate-700"
              >Pilih / Ganti Akun COA:</label
            >
            <span class="text-[10px] text-slate-400"
              >{{ filteredPostingCOA.length }} Akun Tersedia</span
            >
          </div>

          <div class="relative">
            <input
              type="text"
              v-model="coaSearchQuery"
              placeholder="Ketik kode atau nama akun COA..."
              class="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs bg-slate-50 outline-none focus:border-emerald-600 focus:bg-white transition"
            />
            <span class="absolute left-2.5 top-2 text-slate-400 text-xs"
              >🔍</span
            >
          </div>

          <!-- List Akun COA (Scrollable) -->
          <div
            class="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 bg-slate-50/40"
          >
            <div
              v-for="coa in filteredPostingCOA"
              :key="coa.kode"
              @click="selectCOA(coa)"
              class="p-2.5 hover:bg-emerald-50/60 cursor-pointer transition flex items-center justify-between"
              :class="
                editForm.selectedKode === coa.kode
                  ? 'bg-emerald-100/60 font-semibold'
                  : ''
              "
            >
              <div>
                <span
                  class="font-mono font-bold text-[11px]"
                  :class="
                    editForm.selectedKode === coa.kode
                      ? 'text-emerald-950'
                      : 'text-slate-700'
                  "
                  >{{ coa.kode }}</span
                >
                <span class="text-slate-600 text-[11px] ml-2">{{
                  coa.nama
                }}</span>
              </div>
              <span
                v-if="editForm.selectedKode === coa.kode"
                class="text-emerald-700 font-bold text-xs"
                >✓</span
              >
            </div>

            <div
              v-if="filteredPostingCOA.length === 0"
              class="p-6 text-center text-slate-400 text-xs"
            >
              Akun COA tidak ditemukan.
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Modal -->
      <div
        class="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2"
      >
        <button
          @click="showEditModal = false"
          class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
        >
          Batal
        </button>
        <button
          @click="saveEdit"
          class="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
        >
          <span>💾 Simpan Perubahan</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useFinance } from "../../composables/useFinance.js";
import { MASTER_COA_LIST } from "../../constants/coa.js";

const { showEditModal, editForm, confirmSaveEdit } = useFinance();
const coaSearchQuery = ref("");

// Hanya tampilkan akun posting (bukan header)
const postingCOAList = computed(() =>
  MASTER_COA_LIST.filter((c) => !c.isHeader),
);

const filteredPostingCOA = computed(() => {
  const q = coaSearchQuery.value.toLowerCase().trim();
  if (!q) return postingCOAList.value;
  return postingCOAList.value.filter(
    (c) => c.kode.toLowerCase().includes(q) || c.nama.toLowerCase().includes(q),
  );
});

const selectCOA = (coa) => {
  editForm.selectedKode = coa.kode;
  editForm.selectedNama = coa.nama;
};

const saveEdit = () => {
  confirmSaveEdit();
};
</script>
