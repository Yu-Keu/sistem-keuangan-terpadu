<template>
  <div
    class="flex flex-col min-h-screen bg-slate-50 text-slate-800 antialiased font-sans"
  >
    <!-- Toast Notification -->
    <transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="toast.show"
        class="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-2.5 backdrop-blur-md"
      >
        <span
          class="w-5 h-5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center font-bold text-[10px]"
          >✓</span
        >
        <span class="font-medium tracking-wide">{{ toast.message }}</span>
      </div>
    </transition>

    <!-- Loading Modal -->
    <div
      v-if="isLoading"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div
        class="bg-white p-6 rounded-3xl shadow-2xl text-slate-800 text-center max-w-xs border border-slate-100 flex flex-col items-center"
      >
        <div
          class="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-3"
        ></div>
        <p class="font-semibold text-xs text-slate-600 tracking-wide">
          {{ loadingMessage }}
        </p>
      </div>
    </div>

    <!-- Main Navigation Bar -->
    <AppHeader />

    <!-- Main Tab Views -->
    <main
      class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6"
    >
      <TabUpload v-show="activeTab === 'upload'" />
      <TabPengeluaran v-show="activeTab === 'pengeluaran'" />
      <TabBidang v-show="activeTab === 'bidang'" />
      <TabPemasukan v-show="activeTab === 'pemasukan'" />
      <TabAudit v-show="activeTab === 'audit'" />
      <TabMasterCoa v-show="activeTab === 'masterCoa'" />
    </main>

    <!-- Modals & Floating Toolbar -->
    <FloatingActions />
    <ModalMerge />
    <ModalBankDetail />
    <ModalLPJ />
    <ModalEditTransaction />
    <ModalSplitTransaction />
  </div>
</template>

<script setup>
import { useFinance } from "./composables/useFinance.js";
import AppHeader from "./components/AppHeader.vue";
import FloatingActions from "./components/FloatingActions.vue";
import TabUpload from "./components/TabUpload.vue";
import TabPengeluaran from "./components/TabPengeluaran.vue";
import TabBidang from "./components/TabBidang.vue";
import TabPemasukan from "./components/TabPemasukan.vue";
import TabAudit from "./components/TabAudit.vue";
import TabMasterCoa from "./components/TabMasterCoa.vue";
import ModalMerge from "./components/modals/ModalMerge.vue";
import ModalBankDetail from "./components/modals/ModalBankDetail.vue";
import ModalLPJ from "./components/modals/ModalLPJ.vue";
import ModalEditTransaction from "./components/modals/ModalEditTransaction.vue";
import ModalSplitTransaction from "./components/modals/ModalSplitTransaction.vue";

const { activeTab, isLoading, loadingMessage, toast } = useFinance();
</script>
