<template>
  <div
    v-if="showBankDetailModal"
    class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
  >
    <div
      class="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100"
    >
      <div
        class="bg-slate-900 text-white p-5 flex justify-between items-center"
      >
        <div>
          <h3 class="font-bold text-sm">Rincian Rekonsiliasi Bank</h3>
          <p class="text-[11px] text-slate-400">
            Audit perbandingan teks kas kecil vs teks rekening koran
          </p>
        </div>
        <button
          @click="showBankDetailModal = false"
          class="text-slate-400 hover:text-white font-bold"
        >
          ✕
        </button>
      </div>
      <div class="p-6 space-y-4 text-xs" v-if="selectedBankDetailItem">
        <div
          class="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1"
        >
          <span
            class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
            >Uraian yang Ditampilkan:</span
          >
          <p class="font-bold text-slate-800">
            {{ selectedBankDetailItem.uraian }}
          </p>
        </div>
        <div
          class="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200 space-y-1.5"
        >
          <div class="flex justify-between items-center">
            <span
              class="text-[10px] font-bold text-emerald-800 uppercase tracking-wider"
              >Teks Asli Rekening Koran:</span
            >
            <span class="text-[10px] font-mono text-emerald-700"
              >Tgl: {{ selectedBankDetailItem.tanggal }}</span
            >
          </div>
          <p class="text-emerald-950 font-mono text-[11px] leading-relaxed">
            {{
              selectedBankDetailItem.bankRawDescription ||
              selectedBankDetailItem.uraian
            }}
          </p>
          <div
            class="text-[10px] text-slate-500 pt-2 border-t border-emerald-100 flex justify-between"
          >
            <span
              >Nominal:
              <b class="font-mono text-emerald-900">{{
                formatRupiah(
                  selectedBankDetailItem.kredit || selectedBankDetailItem.debet,
                )
              }}</b></span
            >
            <span
              >Akun:
              <b class="text-emerald-900">{{
                selectedBankDetailItem.kasBank
              }}</b></span
            >
          </div>
        </div>
        <div
          v-if="selectedBankDetailItem.matchedBridgeText"
          class="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 space-y-1"
        >
          <div class="flex justify-between items-center">
            <span
              class="text-[10px] font-bold text-amber-800 uppercase tracking-wider"
              >Teks Asal Kas Kecil:</span
            >
            <span
              v-if="selectedBankDetailItem.dateDiffDays > 0"
              class="text-[9px] font-bold text-amber-700"
              >Selisih {{ selectedBankDetailItem.dateDiffDays }} Hari</span
            >
          </div>
          <p class="text-amber-950 font-medium">
            {{ selectedBankDetailItem.matchedBridgeText }}
          </p>
        </div>
      </div>
      <div class="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
        <button
          @click="showBankDetailModal = false"
          class="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFinance } from "../../composables/useFinance.js";
import { formatRupiah } from "../../utils/formatters.js";

const { showBankDetailModal, selectedBankDetailItem } = useFinance();
</script>
