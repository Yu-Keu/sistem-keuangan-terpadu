<script setup>
import { computed } from "vue";
import { useFinance } from "../composables/useFinance.js";
import { formatRupiah, getCategoryBadge } from "../utils/formatters.js";

const {
  filterPengeluaran,
  availableDatesPengeluaran,
  availableKasBanksPengeluaran,
  availablePenerimaPengeluaran,
  availableCategoriesPengeluaran,
  filteredPengeluaran,
  hiddenPengeluaranCount,
  restoreHiddenPengeluaran,
  exportPengeluaranExcel,
  copyNominal,
  ungroupLPJ,
  unmergeGroup,
  handlePengeluaranRowAction,
  handleCopyLPJBundle,
  hidePengeluaranRow,
  totalDebitPengeluaran,
  totalKreditPengeluaran,
  selectedBankDetailItem,
  showBankDetailModal,
  openEditModal,
  expandedLPJGroups,
  toggleExpandLPJ,
} = useFinance();

// =========================================================================
// LOGIKA PILIH SEMUA YANG TAMPIL
// =========================================================================
const selectableFilteredItems = computed(() => {
  return filteredPengeluaran.value.filter(
    (item) => !item.groupId && !item.isMergedGroup && !item.hidden
  );
});

const isAllFilteredSelected = computed(() => {
  if (selectableFilteredItems.value.length === 0) return false;
  return selectableFilteredItems.value.every((item) => item.selected);
});

const isSomeFilteredSelected = computed(() => {
  return (
    selectableFilteredItems.value.some((item) => item.selected) &&
    !isAllFilteredSelected.value
  );
});

const toggleSelectAllFiltered = (e) => {
  const targetState = e.target.checked;
  selectableFilteredItems.value.forEach((item) => {
    item.selected = targetState;
  });
};

const deselectAllFiltered = () => {
  selectableFilteredItems.value.forEach((item) => {
    item.selected = false;
  });
};

const selectedVisibleCount = computed(() => {
  return selectableFilteredItems.value.filter((item) => item.selected).length;
});

// =========================================================================
// LOGIKA GROUP LPJ
// =========================================================================
const processedGroupSummary = computed(() => {
  const map = {};
  filteredPengeluaran.value.forEach((item) => {
    if (item.groupId) {
      if (!map[item.groupId]) {
        map[item.groupId] = {
          groupId: item.groupId,
          tanggal: item.tanggal,
          kasBank: item.kasBank,
          nama: item.nama,
          uraian: item.uraian,
          totalDebit: 0,
          totalKredit: 0,
          items: [],
        };
      }
      map[item.groupId].totalDebit += item.debet || 0;
      map[item.groupId].totalKredit += item.kredit || 0;
      map[item.groupId].items.push(item);
    }
  });
  return map;
});

const renderedGroupHeaders = new Set();
const resetGroupTracker = () => {
  renderedGroupHeaders.clear();
  return true;
};

const openBankDetail = (item) => {
  selectedBankDetailItem.value = item;
  showBankDetailModal.value = true;
};
</script>

<template>
  <section class="space-y-4">
    <!-- Filter Toolbar -->
    <div
      class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3"
    >
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <!-- Filter Tanggal -->
        <select
          v-model="filterPengeluaran.date"
          class="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition"
        >
          <option value="ALL">Semua Tanggal</option>
          <option v-for="d in availableDatesPengeluaran" :key="d" :value="d">
            {{ d }}
          </option>
        </select>

        <!-- Filter Kas/Bank -->
        <select
          v-model="filterPengeluaran.kasBank"
          class="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition"
        >
          <option value="ALL">Semua Kas/Bank</option>
          <option
            v-for="kb in availableKasBanksPengeluaran"
            :key="kb"
            :value="kb"
          >
            {{ kb }}
          </option>
        </select>

        <!-- Filter Penerima -->
        <select
          v-model="filterPengeluaran.penerima"
          class="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition"
        >
          <option value="ALL">Semua Penerima</option>
          <option
            v-for="nama in availablePenerimaPengeluaran"
            :key="nama"
            :value="nama"
          >
            {{ nama }}
          </option>
        </select>

        <!-- Filter Label / Kategori Transaksi -->
        <select
          v-model="filterPengeluaran.kategori"
          class="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition"
        >
          <option value="ALL">Semua Label</option>
          <option
            v-for="cat in availableCategoriesPengeluaran"
            :key="cat"
            :value="cat"
          >
            {{ cat }}
          </option>
        </select>

        <!-- Filter Sumber -->
        <select
          v-model="filterPengeluaran.sourceType"
          class="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition"
        >
          <option value="ALL">Semua Sumber</option>
          <option value="KAS_TUNAI">Kas Tunai</option>
          <option value="MATCHED_BANK">Match Bank Riil</option>
          <option value="UNRECORDED_BANK">Belum Dicatat Kasir</option>
          <option value="MERGED">Hasil Merge</option>
        </select>

        <!-- Search Input -->
        <div class="relative">
          <input
            type="text"
            v-model="filterPengeluaran.search"
            placeholder="Cari uraian/akun..."
            class="border border-slate-200 rounded-xl pl-3 pr-7 py-1.5 w-44 bg-slate-50 outline-none focus:border-emerald-500 focus:bg-white transition placeholder:text-slate-400 font-medium"
          />
          <span
            v-if="filterPengeluaran.search"
            @click="filterPengeluaran.search = ''"
            class="absolute right-2 top-1.5 text-slate-400 cursor-pointer hover:text-slate-700 font-bold"
            >✕</span
          >
        </div>

        <!-- PILL AKTIF & TOMBOL HAPUS FILTER PENERIMA (DIKEMBALIKAN) -->
        <div
          v-if="filterPengeluaran.penerima !== 'ALL'"
          class="flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-2xs"
        >
          <span>Penerima: {{ filterPengeluaran.penerima }}</span>
          <button
            @click="filterPengeluaran.penerima = 'ALL'"
            class="text-emerald-700 hover:text-emerald-950 font-black ml-1 cursor-pointer"
            title="Hapus Filter Penerima"
          >
            ✕
          </button>
        </div>

        <!-- PILL AKTIF & TOMBOL HAPUS FILTER LABEL -->
        <div
          v-if="filterPengeluaran.kategori !== 'ALL'"
          class="flex items-center gap-1.5 bg-sky-100 text-sky-900 border border-sky-300 text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-2xs"
        >
          <span>Label: {{ filterPengeluaran.kategori }}</span>
          <button
            @click="filterPengeluaran.kategori = 'ALL'"
            class="text-sky-700 hover:text-sky-950 font-black ml-1 cursor-pointer"
            title="Hapus Filter Label"
          >
            ✕
          </button>
        </div>

        <!-- PILL STATUS JUMLAH TERPILIH -->
        <div
          v-if="selectedVisibleCount > 0"
          class="flex items-center gap-1.5 bg-slate-800 text-white text-[11px] font-semibold px-2.5 py-1 rounded-xl shadow-2xs"
        >
          <span>{{ selectedVisibleCount }} Terpilih</span>
          <button
            @click="deselectAllFiltered"
            class="text-slate-400 hover:text-white ml-1 font-bold text-xs"
            title="Batalkan Semua Pilihan"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Tombol Aksi Kanan -->
      <div class="flex items-center gap-2">
        <button
          v-if="hiddenPengeluaranCount > 0"
          @click="restoreHiddenPengeluaran"
          class="text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl font-semibold transition"
        >
          Pulihkan ({{ hiddenPengeluaranCount }})
        </button>
        <button
          @click="exportPengeluaranExcel"
          class="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl font-bold shadow-xs transition"
        >
          Download Excel
        </button>
      </div>
    </div>

    <!-- Main Pengeluaran Table -->
    <div
      class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-xs">
          <thead class="bg-slate-50 text-slate-600 font-semibold select-none border-b border-slate-200">
            <tr>
              <!-- CHECKBOX PILIH SEMUA YANG TAMPIL -->
              <th class="px-3 py-3 text-center w-24">
                <div class="flex flex-col items-center justify-center gap-1">
                  <div class="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      :checked="isAllFilteredSelected"
                      :indeterminate.prop="isSomeFilteredSelected"
                      :disabled="selectableFilteredItems.length === 0"
                      @change="toggleSelectAllFiltered"
                      class="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Pilih / Batal Semua Baris yang Sedang Tampil"
                    />
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Semua
                    </span>
                  </div>
                </div>
              </th>

              <th class="px-3 py-3 text-left w-32">Tanggal & Akun</th>
              <th class="px-3 py-3 text-left w-36">Penerima</th>
              <th class="px-3 py-3 text-left w-52 text-emerald-950">COA Pembebanan</th>
              <th class="px-4 py-3 text-left">Uraian Transaksi</th>
              <th class="px-3 py-3 text-right w-28">Debit (Rp)</th>
              <th class="px-3 py-3 text-right w-28">Kredit (Rp)</th>
              <th class="px-3 py-3 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <template
              v-if="resetGroupTracker()"
              v-for="item in filteredPengeluaran"
              :key="item.id"
            >
              <!-- A. BARIS RINGKASAN MASTER LPJ -->
              <tr
                v-if="item.groupId && !renderedGroupHeaders.has(item.groupId)"
                :key="'header-' + item.groupId"
                class="bg-emerald-50/80 border-y-2 border-emerald-300 font-medium"
              >
                <td class="px-3 py-2.5 text-center">
                  <span class="hidden">{{
                    renderedGroupHeaders.add(item.groupId)
                  }}</span>
                  <div class="flex flex-col items-center gap-1">
                    <span
                      class="bg-emerald-700 text-white font-bold text-[9px] px-2 py-0.5 rounded-full shadow-2xs"
                    >
                      {{ item.groupId }}
                    </span>
                    <button
                      @click="toggleExpandLPJ(item.groupId)"
                      class="text-[9px] font-bold text-emerald-900 hover:text-emerald-950 bg-white border border-emerald-300 px-1.5 py-0.5 rounded shadow-2xs transition"
                    >
                      {{
                        expandedLPJGroups.has(item.groupId)
                          ? "Tutup"
                          : "Rincian"
                      }}
                      ({{ processedGroupSummary[item.groupId]?.items.length }})
                    </button>
                  </div>
                </td>

                <td class="px-3 py-2.5 whitespace-nowrap">
                  <div class="font-mono font-bold text-slate-800">
                    {{ item.tanggal }}
                  </div>
                  <div class="text-[10px] text-emerald-900 font-semibold">
                    {{ item.kasBank }}
                  </div>
                </td>

                <td class="px-3 py-2.5">
                  <div
                    @click="filterPengeluaran.penerima = item.nama"
                    class="font-bold text-emerald-950 flex items-center gap-1 cursor-pointer hover:underline"
                    title="Klik untuk filter khusus orang ini"
                  >
                    <span class="truncate max-w-[120px]">{{ item.nama }}</span>
                  </div>
                </td>

                <td class="px-3 py-2.5">
                  <div
                    class="text-[10px] font-bold text-emerald-900 bg-white border border-emerald-200 p-1.5 rounded-lg"
                  >
                    Paket Jurnal LPJ ({{
                      processedGroupSummary[item.groupId]?.items.length
                    }} Pos)
                  </div>
                </td>

                <td class="px-4 py-2.5">
                  <div class="font-bold text-emerald-950 text-xs">
                    {{ item.uraian }}
                  </div>
                  <div class="text-[10px] text-emerald-700">
                    Paket konsolidasi belanja riil & uang muka kasbon
                  </div>
                </td>

                <td
                  class="px-3 py-2.5 text-right font-mono font-bold text-emerald-950"
                >
                  {{
                    formatRupiah(processedGroupSummary[item.groupId]?.totalDebit)
                  }}
                </td>

                <td
                  class="px-3 py-2.5 text-right font-mono font-bold text-emerald-950"
                >
                  {{
                    formatRupiah(processedGroupSummary[item.groupId]?.totalKredit)
                  }}
                </td>

                <td class="px-3 py-2.5 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <button
                      @click="handleCopyLPJBundle(item.groupId)"
                      class="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 text-[10px] rounded-lg font-bold shadow-xs transition"
                      title="Salin jurnal LPJ untuk AHK"
                    >
                      Copy LPJ
                    </button>
                    <button
                      @click="ungroupLPJ(item.groupId)"
                      class="text-[10px] text-rose-600 hover:underline px-1 font-semibold"
                    >
                      Buka
                    </button>
                  </div>
                </td>
              </tr>

              <!-- B. RINCIAN ANAK LPJ -->
              <tr
                v-if="item.groupId && expandedLPJGroups.has(item.groupId)"
                :key="'child-' + item.id"
                class="bg-slate-50 text-[11px]"
              >
                <td class="px-3 py-1.5 text-center text-slate-400">↳</td>
                <td class="px-3 py-1.5 font-mono text-slate-500">
                  {{ item.tanggal }}
                </td>
                <td class="px-3 py-1.5 text-slate-600">{{ item.nama }}</td>
                <td class="px-3 py-1.5">
                  <span class="font-mono font-bold text-slate-700">{{
                    item.kodeAkun
                  }}</span>
                  <span class="text-slate-500 ml-1">- {{ item.namaAkun }}</span>
                </td>
                <td class="px-4 py-1.5 text-slate-600 truncate max-w-[280px]">
                  {{ item.uraian }}
                </td>
                <td class="px-3 py-1.5 text-right font-mono text-slate-700">
                  {{ item.debet > 0 ? formatRupiah(item.debet) : "-" }}
                </td>
                <td class="px-3 py-1.5 text-right font-mono text-slate-700">
                  {{ item.kredit > 0 ? formatRupiah(item.kredit) : "-" }}
                </td>
                <td class="px-3 py-1.5 text-center text-slate-300">-</td>
              </tr>

              <!-- C. BARIS REGULER NON-LPJ -->
              <tr
                v-else-if="!item.groupId"
                :key="'reg-' + item.id"
                class="hover:bg-slate-50 transition"
                :class="{
                  'bg-amber-50/40 border-l-4 border-l-amber-500':
                    getCategoryBadge(item).label === 'PELUNASAN KASBON',
                  'bg-emerald-50/30': item.selected
                }"
              >
                <td class="px-3 py-2.5 text-center">
                  <div class="flex flex-col items-center justify-center gap-1">
                    <span
                      v-if="item.isMergedGroup"
                      class="text-indigo-700 font-bold text-[9px] bg-indigo-100 px-2 py-0.5 rounded-full"
                      >MERGED</span
                    >
                    <input
                      v-else
                      type="checkbox"
                      v-model="item.selected"
                      class="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />

                    <div v-if="item.isMergedGroup" class="text-[9px]">
                      <button
                        @click="unmergeGroup(item.mergeId)"
                        class="text-rose-600 hover:underline font-semibold"
                      >
                        Pisah ({{ item.mergedCount }})
                      </button>
                    </div>
                    <div v-else>
                      <span
                        v-if="item.matchedBridge"
                        @click="openBankDetail(item)"
                        class="bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[8px] px-1.5 py-0.5 rounded cursor-pointer hover:bg-emerald-200 transition block"
                      >
                        Match Bank
                      </span>
                      <span
                        v-else-if="item.isDirectBankOutflow"
                        @click="openBankDetail(item)"
                        class="bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[8px] px-1.5 py-0.5 rounded cursor-pointer hover:bg-amber-200 transition block"
                      >
                        Belum Kasir
                      </span>
                      <span v-else class="text-slate-400 font-medium text-[9px] block"
                        >Tunai</span
                      >
                    </div>
                  </div>
                </td>

                <td class="px-3 py-2.5 whitespace-nowrap">
                  <div class="font-mono font-bold text-slate-700 text-xs">
                    {{ item.tanggal }}
                  </div>
                  <div class="mt-1">
                    <!-- Kas/Bank Colorful Tag -->
                    <span
                      class="text-[10px] font-bold px-2 py-0.5 rounded-md inline-block"
                      :class="{
                        'bg-teal-50 text-teal-800 border border-teal-200':
                          item.kasBank === 'Bank BSI',
                        'bg-purple-50 text-purple-800 border border-purple-200':
                          item.kasBank === 'Bank Muamalat',
                        'bg-emerald-50 text-emerald-800 border border-emerald-200':
                          item.kasBank.includes('Kas Kecil'),
                        'bg-amber-50 text-amber-800 border border-amber-200':
                          item.kasBank.includes('Kas Besar'),
                      }"
                    >
                      {{ item.kasBank }}
                    </span>
                  </div>
                </td>

                <td class="px-3 py-2.5">
                  <div
                    v-if="item.nama && item.nama !== '-'"
                    @click="filterPengeluaran.penerima = item.nama"
                    class="font-semibold text-slate-700 truncate max-w-[130px] cursor-pointer hover:text-emerald-700 hover:underline"
                    :title="`Klik untuk filter: ${item.nama}`"
                  >
                    <span class="truncate">{{ item.nama }}</span>
                  </div>
                  <span v-else class="text-slate-300">-</span>
                </td>

                <!-- COA Pembebanan -->
                <td class="px-3 py-2.5">
                  <div
                    @click="openEditModal(item, 'pengeluaran')"
                    class="bg-emerald-50/80 hover:bg-emerald-100/90 border border-emerald-200 p-1.5 rounded-lg max-w-[210px] cursor-pointer transition group"
                    title="Klik untuk ubah COA"
                  >
                    <div class="flex items-center justify-between">
                      <span
                        class="font-mono font-bold text-emerald-950 text-[11px] leading-none"
                        >{{ item.kodeAkun }}</span
                      >
                      <span
                        class="text-[9px] text-emerald-600 opacity-0 group-hover:opacity-100 transition font-bold"
                        >Edit</span
                      >
                    </div>
                    <div
                      class="text-emerald-900 text-[10px] font-medium truncate mt-0.5"
                      :title="item.namaAkun"
                    >
                      {{ item.namaAkun }}
                    </div>
                  </div>
                </td>

                <!-- Deskripsi & Label Kategori -->
                <td class="px-4 py-2.5">
                  <div class="space-y-1">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <!-- Badge Kategori Bersih -->
                      <span
                        class="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase"
                        :class="getCategoryBadge(item).bg"
                      >
                        {{ getCategoryBadge(item).label }}
                      </span>

                      <!-- ALERT KHUSUS JIKA PELUNASAN KASBON BELUM DIIKAT -->
                      <span
                        v-if="getCategoryBadge(item).label === 'PELUNASAN KASBON'"
                        class="bg-amber-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-2xs tracking-wider"
                        title="Transaksi ini wajib dicentang bersama nota belanja riil lalu klik Ikat LPJ"
                      >
                        PERLU DIIKAT LPJ
                      </span>

                      <span
                        @click="openEditModal(item, 'pengeluaran')"
                        class="text-slate-900 font-medium text-xs hover:text-emerald-700 cursor-pointer transition"
                        title="Klik untuk ubah deskripsi"
                      >
                        {{ item.uraian }}
                      </span>

                      <button
                        v-if="item.bankRawDescription"
                        @click="openBankDetail(item)"
                        class="text-sky-700 hover:text-sky-900 text-[10px] font-bold bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 shrink-0"
                        title="Rincian Mutasi Asli Rekening Koran"
                      >
                        Bank
                      </button>
                    </div>
                  </div>
                </td>

                <td
                  @click="copyNominal(item.debet)"
                  class="px-3 py-2.5 text-right font-mono cursor-pointer hover:bg-emerald-100/50 transition rounded font-semibold whitespace-nowrap"
                  :class="item.debet > 0 ? 'text-slate-900' : 'text-slate-300'"
                >
                  {{ item.debet > 0 ? formatRupiah(item.debet) : "-" }}
                </td>

                <td
                  @click="copyNominal(item.kredit)"
                  class="px-3 py-2.5 text-right font-mono cursor-pointer hover:bg-emerald-100/50 transition rounded font-semibold whitespace-nowrap"
                  :class="item.kredit > 0 ? 'text-slate-900' : 'text-slate-300'"
                >
                  {{ item.kredit > 0 ? formatRupiah(item.kredit) : "-" }}
                </td>

                <td class="px-3 py-2.5 text-center">
                  <div
                    v-if="!item.selected"
                    class="flex items-center justify-center gap-1"
                  >
                    <!-- <button
                      @click="openEditModal(item, 'pengeluaran')"
                      class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-1 rounded-lg text-[10px] font-semibold transition"
                      title="Edit"
                    >
                      Edit
                    </button> -->
                    <button
                      @click="handlePengeluaranRowAction(item)"
                      :class="
                        item.justCopied
                          ? 'bg-emerald-600 text-white'
                          : item.wasCopied
                            ? 'bg-emerald-800 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                      "
                      class="px-2 py-1 text-[10px] rounded-lg font-semibold transition min-w-[48px]"
                      title="Salin Payload Jurnal"
                    >
                      {{ item.justCopied ? "OK" : item.wasCopied ? "Lagi" : "Copy" }}
                    </button>
                    <button
                      @click="hidePengeluaranRow(item)"
                      class="text-slate-400 hover:text-rose-600 px-1 py-0.5 text-xs font-bold transition"
                      title="Sembunyikan"
                    >
                      ✕
                    </button>
                  </div>
                  <span v-else class="text-slate-300">-</span>
                </td>
              </tr>
            </template>

            <tr v-if="filteredPengeluaran.length === 0">
              <td colspan="8" class="p-12 text-center text-slate-400">
                Tidak ada data transaksi yang sesuai filter.
              </td>
            </tr>
          </tbody>

          <!-- Table Footer Total -->
          <tfoot class="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
            <tr>
              <td
                colspan="5"
                class="px-4 py-3 text-right uppercase text-[10px] text-slate-500 font-semibold"
              >
                Total Terfilter
              </td>
              <td class="px-3 py-3 text-right font-mono text-xs">
                {{ formatRupiah(totalDebitPengeluaran) }}
              </td>
              <td class="px-3 py-3 text-right font-mono text-xs">
                {{ formatRupiah(totalKreditPengeluaran) }}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </section>
</template>