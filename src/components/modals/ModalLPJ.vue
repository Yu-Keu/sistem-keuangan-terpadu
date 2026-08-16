<template>
  <div
    v-if="showLPJModal"
    class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
  >
    <div
      class="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100"
    >
      <div class="bg-emerald-900 text-white p-5">
        <h3 class="font-bold text-sm">Ikat Jurnal LPJ Kasbon (100% Balance)</h3>
        <p class="text-[11px] text-emerald-200 mt-0.5">
          Sistem otomatis menghitung selisih uang kembali/reimburse
        </p>
      </div>
      <div class="p-6 space-y-4 text-xs">
        <div>
          <label class="font-bold text-slate-700 block mb-1"
            >Keterangan LPJ Bersama:</label
          >
          <input
            type="text"
            v-model="lpjUraian"
            class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50 outline-none focus:border-emerald-600"
          />
        </div>
        <div class="space-y-2 border-t border-slate-100 pt-3">
          <div class="flex justify-between items-center">
            <span class="text-slate-500">1. Total Belanja Beban:</span>
            <span class="font-bold text-emerald-700 font-mono"
              >{{ formatRupiah(lpjSummary.totalBeban) }} (DEBIT)</span
            >
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">2. Pelunasan Kasbon (Uang Muka):</span>
            <span class="font-bold text-rose-700 font-mono"
              >{{ formatRupiah(lpjSummary.totalKasbon) }} (KREDIT)</span
            >
          </div>
          <div
            class="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex justify-between items-center"
          >
            <div>
              <span
                class="font-bold text-xs block"
                :class="
                  lpjSummary.isReimburse ? 'text-amber-700' : 'text-sky-700'
                "
                >{{ lpjSummary.status }}</span
              >
              <span class="text-[10px] text-slate-400"
                >Penyeimbang Otomatis Kas/Bank</span
              >
            </div>
            <span class="font-bold text-sm font-mono text-slate-900"
              >{{ formatRupiah(lpjSummary.selisih) }}
              {{ lpjSummary.isReimburse ? "(KREDIT)" : "(DEBIT)" }}</span
            >
          </div>
        </div>
      </div>
      <div
        class="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2"
      >
        <button
          @click="showLPJModal = false"
          class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
        >
          Batal
        </button>
        <button
          @click="confirmLPJGroup"
          class="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition"
        >
          Simpan & Ikat Jurnal
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFinance } from "../../composables/useFinance.js";
import { formatRupiah } from "../../utils/formatters.js";

const { showLPJModal, lpjUraian, lpjSummary, confirmLPJGroup } = useFinance();
</script>
