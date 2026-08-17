<template>
  <header
    class="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs"
  >
    <div
      class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 bg-slate-900 text-emerald-400 rounded-xl flex items-center justify-center font-bold text-sm shadow-inner"
        >
          IT
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1
              class="text-xs font-bold tracking-tight text-slate-900 uppercase"
            >
              Sistem Keuangan Terpadu
            </h1>
            <span
              class="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200"
              >v2.0 Vue</span
            >
          </div>
          <p class="text-[11px] text-slate-500">
            Rekonsiliasi Mutasi Riil, Kasbon LPJ & Jurnal Pemasukan
          </p>
        </div>
      </div>

      <!-- Live Bank Balances -->
      <div class="flex items-center gap-2 flex-wrap">
        <div
          class="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
        >
          <span class="text-[10px] font-medium text-slate-500"
            >📅 Saldo Per:</span
          >
          <select
            v-model="selectedBankBalanceDate"
            class="bg-transparent text-slate-800 font-semibold text-xs border-0 outline-none cursor-pointer"
          >
            <option value="LATEST">Posisi Paling Akhir</option>
            <option v-for="d in allBankAvailableDates" :key="d" :value="d">
              Per {{ d }}
            </option>
          </select>
        </div>

        <div
          class="bg-emerald-50/70 border border-emerald-200/70 px-3 py-1.5 rounded-xl"
        >
          <div class="flex items-center justify-between gap-3 text-[10px]">
            <span class="font-bold text-emerald-800 uppercase">BSI</span>
            <span class="text-slate-400 text-[9px]">{{
              computedBankBalances.bsiDate
                ? "per " + computedBankBalances.bsiDate
                : "-"
            }}</span>
          </div>
          <div class="text-xs font-mono font-bold text-emerald-950">
            {{ formatRupiah(computedBankBalances.bsi) }}
          </div>
        </div>

        <div
          class="bg-purple-50/70 border border-purple-200/70 px-3 py-1.5 rounded-xl"
        >
          <div class="flex items-center justify-between gap-3 text-[10px]">
            <span class="font-bold text-purple-800 uppercase">Muamalat</span>
            <span class="text-slate-400 text-[9px]">{{
              computedBankBalances.muamalatDate
                ? "per " + computedBankBalances.muamalatDate
                : "-"
            }}</span>
          </div>
          <div class="text-xs font-mono font-bold text-purple-950">
            {{ formatRupiah(computedBankBalances.muamalat) }}
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <nav class="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
        <button
          @click="activeTab = 'pengeluaran'"
          :class="activeTab === 'pengeluaran' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900 font-medium'"
          class="px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
        >
          <span>💸 Pengeluaran</span>
          <span class="bg-slate-100 text-[10px] px-1.5 py-0.5 rounded-full font-mono text-slate-700 font-semibold">{{ pengeluaranData.length }}</span>
        </button>

        <!-- TAB PER BIDANG -->
        <button
          @click="activeTab = 'bidang'"
          :class="activeTab === 'bidang' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900 font-medium'"
          class="px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
        >
          <span>🏢 Per Bidang</span>
          <span class="bg-indigo-100 text-[10px] px-1.5 py-0.5 rounded-full font-mono text-indigo-900 font-semibold">{{ availableBidangList.length }}</span>
        </button>

        <button
          @click="activeTab = 'pemasukan'"
          :class="activeTab === 'pemasukan' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900 font-medium'"
          class="px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
        >
          <span>💰 Pemasukan</span>
          <span class="bg-slate-100 text-[10px] px-1.5 py-0.5 rounded-full font-mono text-slate-700 font-semibold">{{ pemasukanData.length }}</span>
        </button>

        <button
          @click="activeTab = 'audit'"
          :class="activeTab === 'audit' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900 font-medium'"
          class="px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
        >
          <span>🔍 Log Eliminasi</span>
          <span class="bg-slate-100 text-[10px] px-1.5 py-0.5 rounded-full font-mono text-slate-700 font-semibold">{{ eliminatedBridges.length }}</span>
        </button>

        <button
          @click="activeTab = 'masterCoa'"
          :class="activeTab === 'masterCoa' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900 font-medium'"
          class="px-3 py-1.5 rounded-xl transition"
        >
          <span>📚 COA</span>
        </button>

        <button
          @click="activeTab = 'upload'"
          :class="activeTab === 'upload' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 font-semibold'"
          class="px-3 py-1.5 rounded-xl transition flex items-center gap-1"
        >
          <span>📁 Upload ({{ uploadedFilesCount }}/4)</span>
        </button>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { useFinance } from "../composables/useFinance.js";
import { formatRupiah } from "../utils/formatters.js";

const {
  activeTab,
  selectedBankBalanceDate,
  allBankAvailableDates,
  computedBankBalances,
  pengeluaranData,
  pemasukanData,
  eliminatedBridges,
  uploadedFilesCount,
  availableBidangList, // <-- Ditambahkan di sini
} = useFinance();
</script>