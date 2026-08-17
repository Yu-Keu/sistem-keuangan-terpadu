<template>
  <div
    v-if="showSplitModal"
    class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
  >
    <div
      class="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
    >
      <!-- Modal Header -->
      <div class="bg-indigo-900 text-white p-5 flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-sm">✂️ Split Transaksi per Bidang / COA</h3>
            <span class="text-[10px] bg-indigo-500/40 text-indigo-200 px-2 py-0.5 rounded-full font-bold">
              Multi-Alokasi
            </span>
          </div>
          <p class="text-[11px] text-indigo-200 mt-0.5">
            Pecah 1 transaksi glondongan menjadi beberapa alokasi bidang & akun secara presisi
          </p>
        </div>
        <button
          @click="showSplitModal = false"
          class="text-indigo-200 hover:text-white font-bold p-1"
        >
          ✕
        </button>
      </div>

      <!-- Parent Info Bar -->
      <div class="bg-slate-50 border-b border-slate-200/80 px-6 py-3 flex flex-wrap items-center justify-between text-xs gap-2">
        <div>
          <span class="text-slate-400 text-[10px] block">Transaksi Asal:</span>
          <span class="font-bold text-slate-800">{{ splitSourceItem?.uraian }}</span>
        </div>
        <div class="text-right">
          <span class="text-slate-400 text-[10px] block">Nominal Transaksi:</span>
          <span class="font-mono font-extrabold text-sm text-indigo-950">
            {{ formatRupiah(parentNominal) }}
          </span>
        </div>
      </div>

      <!-- Modal Body (Split Rows) -->
      <div class="p-6 space-y-4 text-xs overflow-y-auto flex-grow">
        <div
          v-for="(row, idx) in splitRows"
          :key="row.id"
          class="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3 relative group"
        >
          <div class="flex items-center justify-between border-b border-slate-200 pb-2">
            <span class="font-bold text-slate-700 text-xs">
              Alokasi #{{ idx + 1 }}
            </span>
            <button
              v-if="splitRows.length > 2"
              @click="removeSplitRow(idx)"
              class="text-[11px] text-rose-600 hover:underline font-bold"
            >
              Hapus Baris
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Pilihan Bidang -->
            <div>
              <label class="font-bold text-slate-600 block mb-1">Kode / Bidang Unit:</label>
              <select
                v-model="row.kodeBidang"
                @change="handleBidangChange(row)"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs font-semibold outline-none focus:border-indigo-600"
              >
                <option v-for="b in availableBidangList" :key="b.kode" :value="b.kode">
                  [{{ b.kode }}] {{ b.nama }}
                </option>
              </select>
            </div>

            <!-- Pilihan Akun COA -->
            <div>
              <label class="font-bold text-slate-600 block mb-1">Akun Beban (COA):</label>
              <select
                v-model="row.kodeAkun"
                @change="handleCOAChange(row)"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs font-semibold outline-none focus:border-indigo-600"
              >
                <option v-for="c in postingCOAList" :key="c.kode" :value="c.kode">
                  {{ c.kode }} - {{ c.nama }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <!-- Uraian Spesifik -->
            <div class="sm:col-span-2">
              <label class="font-bold text-slate-600 block mb-1">Uraian / Keterangan Spesifik:</label>
              <input
                type="text"
                v-model="row.uraian"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs outline-none focus:border-indigo-600 font-medium"
                placeholder="Rincian belanja bidang ini..."
              />
            </div>

            <!-- Nominal Alokasi -->
            <div>
              <label class="font-bold text-slate-600 block mb-1">Nominal (Rp):</label>
              <input
                type="number"
                v-model.number="row.nominal"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs font-mono font-bold text-slate-800 outline-none focus:border-indigo-600 text-right"
              />
            </div>
          </div>
        </div>

        <button
          @click="addSplitRow"
          class="w-full py-2.5 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 text-indigo-800 font-bold rounded-2xl transition text-xs flex items-center justify-center gap-1.5"
        >
          <span>➕ Tambah Alokasi Bidang Lain</span>
        </button>
      </div>

      <!-- Split Balance Tracker Footer -->
      <div class="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
        <div class="flex items-center justify-between text-xs font-semibold">
          <div class="flex items-center gap-4">
            <div>
              <span class="text-slate-500">Total Di-split:</span>
              <b class="font-mono ml-1 text-slate-800">{{ formatRupiah(totalSplitNominal) }}</b>
            </div>
            <div>
              <span class="text-slate-500">Sisa Selisih:</span>
              <b
                class="font-mono ml-1"
                :class="Math.abs(splitDifference) < 0.01 ? 'text-emerald-700' : 'text-rose-600 font-bold'"
              >
                {{ formatRupiah(splitDifference) }}
                {{ Math.abs(splitDifference) < 0.01 ? '(PAS ✓)' : '' }}
              </b>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="showSplitModal = false"
              class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              Batal
            </button>
            <button
              @click="confirmSplitTransaction"
              :disabled="Math.abs(splitDifference) >= 0.01"
              class="px-5 py-2 text-xs font-bold rounded-xl transition shadow-xs text-white"
              :class="
                Math.abs(splitDifference) < 0.01
                  ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed text-slate-500'
              "
            >
              Simpan Hasil Split
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useFinance } from "../../composables/useFinance.js";
import { MASTER_COA_LIST } from "../../constants/coa.js";
import { formatRupiah } from "../../utils/formatters.js";

const {
  showSplitModal,
  splitSourceItem,
  splitRows,
  availableBidangList,
  addSplitRow,
  removeSplitRow,
  confirmSplitTransaction,
} = useFinance();

const postingCOAList = computed(() => MASTER_COA_LIST.filter((c) => !c.isHeader));

const parentNominal = computed(() => {
  if (!splitSourceItem.value) return 0;
  return Math.abs(splitSourceItem.value.debet || splitSourceItem.value.kredit || 0);
});

const totalSplitNominal = computed(() => {
  return splitRows.value.reduce((acc, row) => acc + (parseFloat(row.nominal) || 0), 0);
});

const splitDifference = computed(() => {
  return parentNominal.value - totalSplitNominal.value;
});

const handleBidangChange = (row) => {
  const b = availableBidangList.value.find((x) => x.kode === row.kodeBidang);
  if (b) row.bidang = b.nama;
};

const handleCOAChange = (row) => {
  const c = postingCOAList.value.find((x) => x.kode === row.kodeAkun);
  if (c) row.namaAkun = c.nama;
};
</script>