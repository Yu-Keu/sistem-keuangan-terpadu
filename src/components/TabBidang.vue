<template>
  <section class="space-y-4">
    <!-- Filter Toolbar Tab Bidang -->
    <div
      class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3"
    >
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <!-- Filter Kode Bidang -->
        <select
          v-model="filterBidang.kodeBidang"
          class="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition"
        >
          <option value="ALL">Semua Kode Bidang</option>
          <option v-for="b in availableBidangList" :key="b.kode" :value="b.kode">
            [{{ b.kode }}] {{ b.nama }}
          </option>
        </select>

        <!-- Filter Tanggal -->
        <select
          v-model="filterBidang.date"
          class="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition"
        >
          <option value="ALL">Semua Tanggal</option>
          <option v-for="d in availableDatesPengeluaran" :key="d" :value="d">
            {{ d }}
          </option>
        </select>

        <!-- Filter Status Split -->
        <select
          v-model="filterBidang.statusSplit"
          class="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition"
        >
          <option value="ALL">Semua Status Split</option>
          <option value="UNSPLIT">Belum Di-split</option>
          <option value="SPLIT">Sudah Di-split</option>
        </select>

        <!-- Search Input -->
        <div class="relative">
          <input
            type="text"
            v-model="filterBidang.search"
            placeholder="Cari bidang, uraian, COA..."
            class="border border-slate-200 rounded-xl pl-3 pr-7 py-1.5 w-56 bg-slate-50 outline-none focus:border-indigo-500 focus:bg-white transition placeholder:text-slate-400 font-medium"
          />
          <span
            v-if="filterBidang.search"
            @click="filterBidang.search = ''"
            class="absolute right-2 top-1.5 text-slate-400 cursor-pointer hover:text-slate-700 font-bold"
            >✕</span
          >
        </div>

        <!-- Pill Aktif Filter Bidang -->
        <div
          v-if="filterBidang.kodeBidang !== 'ALL'"
          class="flex items-center gap-1.5 bg-indigo-100 text-indigo-900 border border-indigo-300 text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-2xs"
        >
          <span>Bidang: {{ filterBidang.kodeBidang }}</span>
          <button
            @click="filterBidang.kodeBidang = 'ALL'"
            class="text-indigo-700 hover:text-indigo-950 font-black ml-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      <span class="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200">
        {{ filteredBidangData.length }} Transaksi
      </span>
    </div>

    <!-- Main Table Bidang -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-xs">
          <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 select-none">
            <tr>
              <th class="px-3 py-3 text-left w-32">Tgl & Kas/Bank</th>
              <th class="px-3 py-3 text-left w-48 text-indigo-950">Kode & Bidang Unit</th>
              <th class="px-3 py-3 text-left w-48">Akun COA</th>
              <th class="px-4 py-3 text-left">Uraian Transaksi</th>
              <th class="px-3 py-3 text-right w-32">Nominal (Rp)</th>
              <th class="px-3 py-3 text-center w-36">Aksi Split & Edit</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="item in filteredBidangData"
              :key="item.id"
              class="hover:bg-slate-50/80 transition"
              :class="{
                'bg-indigo-50/40': item.isSplitChild,
                'bg-slate-100 opacity-60 line-through': item.isSplitParent
              }"
            >
              <!-- 1. Tanggal & Kas/Bank -->
              <td class="px-3 py-2.5 whitespace-nowrap">
                <div class="font-mono font-bold text-slate-800 text-xs">
                  {{ item.tanggal }}
                </div>
                <div class="text-[10px] text-slate-500 font-semibold mt-0.5">
                  {{ item.kasBank }}
                </div>
              </td>

              <!-- 2. Kode & Nama Bidang -->
              <td class="px-3 py-2.5">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-mono font-bold px-2 py-0.5 rounded-md text-[10px] bg-indigo-100 text-indigo-900 border border-indigo-200">
                    {{ item.kodeBidang || "01" }}
                  </span>
                  <span class="font-bold text-slate-800 text-xs">
                    {{ item.bidang || "Markaz / Pusat" }}
                  </span>
                </div>
              </td>

              <!-- 3. Akun COA -->
              <td class="px-3 py-2.5">
                <div
                  @click="openEditModal(item, 'pengeluaran')"
                  class="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-1.5 rounded-lg cursor-pointer transition group"
                  title="Klik untuk ubah COA"
                >
                  <span class="font-mono font-bold text-slate-900 text-[11px] block">
                    {{ item.kodeAkun }}
                  </span>
                  <span class="text-slate-600 text-[10px] font-medium truncate block max-w-[180px]">
                    {{ item.namaAkun }}
                  </span>
                </div>
              </td>

              <!-- 4. Uraian Transaksi -->
              <td class="px-4 py-2.5">
                <div class="space-y-1">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span
                      v-if="item.isSplitChild"
                      class="bg-indigo-600 text-white font-bold text-[8px] px-1.5 py-0.2 rounded"
                    >
                      HASIL SPLIT
                    </span>
                    <span
                      v-else-if="item.isSplitParent"
                      class="bg-slate-400 text-white font-bold text-[8px] px-1.5 py-0.2 rounded"
                    >
                      INDUK ({{ item.splitCount }} Sub)
                    </span>

                    <span class="text-slate-900 font-medium text-xs">
                      {{ item.uraian }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- 5. Nominal (Debet / Kredit) -->
              <td
                @click="copyNominal(item.debet || item.kredit)"
                class="px-3 py-2.5 text-right font-mono font-bold text-xs text-slate-900 cursor-pointer hover:bg-emerald-100/50 transition rounded whitespace-nowrap"
                title="Klik untuk salin nominal"
              >
                {{ formatRupiah(item.debet || item.kredit) }}
              </td>

              <!-- 6. Aksi Split & Batal -->
              <td class="px-3 py-2.5 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <!-- Tombol Split Transaksi -->
                  <button
                    v-if="!item.isSplitChild && !item.isSplitParent"
                    @click="openSplitModal(item)"
                    class="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 text-[10px] rounded-lg font-bold shadow-xs transition flex items-center gap-1"
                    title="Pecah nominal transaksi ke beberapa kode bidang"
                  >
                    <span>✂️ Split</span>
                  </button>

                  <!-- Tombol Batal Split -->
                  <button
                    v-if="item.isSplitChild || item.isSplitParent"
                    @click="unsplitTransaction(item.splitGroupId)"
                    class="text-[10px] text-rose-600 hover:underline font-bold"
                    title="Batalkan alokasi split"
                  >
                    Batal Split
                  </button>

                  <!-- Tombol Edit -->
                  <button
                    @click="openEditModal(item, 'pengeluaran')"
                    class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 text-[10px] rounded-lg font-semibold transition"
                  >
                    Edit
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredBidangData.length === 0">
              <td colspan="6" class="p-12 text-center text-slate-400">
                Tidak ada data transaksi yang cocok dengan filter bidang ini.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useFinance } from "../composables/useFinance.js";
import { formatRupiah } from "../utils/formatters.js";

const {
  filterBidang,
  availableDatesPengeluaran,
  availableBidangList,
  filteredBidangData,
  openSplitModal,
  unsplitTransaction,
  openEditModal,
  copyNominal,
} = useFinance();
</script>