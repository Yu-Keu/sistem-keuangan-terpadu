<template>
  <transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="translate-y-10 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-10 opacity-0"
  >
    <div
      v-if="activeTab === 'pengeluaran' && selectedCountPengeluaran > 1"
      class="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-2xl border border-slate-700/80 flex items-center gap-3"
    >
      <span
        class="font-mono text-xs font-semibold bg-slate-800 px-3 py-1 rounded-full text-emerald-300 border border-slate-700"
      >
        {{ selectedCountPengeluaran }} Baris Dipilih
      </span>
      <button
        @click="openMergeModal"
        class="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
      >
        <span>🔗 Gabung Transaksi Bank</span>
      </button>
      <button
        @click="calculateLPJGroup"
        class="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
      >
        <span>📑 Ikat LPJ Kasbon (Balance)</span>
      </button>
    </div>
  </transition>
</template>

<script setup>
import { useFinance } from "../composables/useFinance.js";

const {
  activeTab,
  selectedCountPengeluaran,
  openMergeModal,
  calculateLPJGroup,
} = useFinance();
</script>
