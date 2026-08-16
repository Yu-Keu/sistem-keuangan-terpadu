<template>
  <div
    v-if="showMergeModal"
    class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
  >
    <div
      class="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100"
    >
      <div class="bg-indigo-900 text-white p-5">
        <h3 class="font-bold text-sm">Gabung / Merge Transaksi Bank</h3>
        <p class="text-[11px] text-indigo-200 mt-0.5">
          Satukan mutasi bank sejenis menjadi 1 baris jurnal konsolidasi
        </p>
      </div>
      <div class="p-6 space-y-4 text-xs">
        <div>
          <label class="font-bold text-slate-700 block mb-1"
            >Tanggal Jurnal:</label
          >
          <input
            type="text"
            v-model="mergeForm.tanggal"
            class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50 outline-none focus:border-indigo-600"
          />
        </div>
        <div>
          <label class="font-bold text-slate-700 block mb-1"
            >Uraian Konsolidasi:</label
          >
          <input
            type="text"
            v-model="mergeForm.uraian"
            class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50 outline-none focus:border-indigo-600"
          />
        </div>
        <div>
          <label class="font-bold text-slate-700 block mb-1"
            >Akun COA Pembebanan:</label
          >
          <input
            type="text"
            v-model="mergeForm.coa"
            class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50 outline-none focus:border-indigo-600"
          />
        </div>
        <div
          class="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-100 flex justify-between items-center"
        >
          <div>
            <span class="font-bold text-indigo-950 block"
              >{{ mergeForm.itemCount }} Transaksi Digabung</span
            >
            <span class="text-[10px] text-indigo-700">{{
              mergeForm.kasBank
            }}</span>
          </div>
          <span class="font-bold text-base font-mono text-indigo-950">{{
            formatRupiah(mergeForm.totalNominal)
          }}</span>
        </div>
      </div>
      <div
        class="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2"
      >
        <button
          @click="showMergeModal = false"
          class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
        >
          Batal
        </button>
        <button
          @click="confirmMergeGroup"
          class="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition"
        >
          Konfirmasi Gabung
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFinance } from "../../composables/useFinance.js";
import { formatRupiah } from "../../utils/formatters.js";

const { showMergeModal, mergeForm, confirmMergeGroup } = useFinance();
</script>
