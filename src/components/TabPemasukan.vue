<template>
  <section class="space-y-4">
    <!-- Filter & Toolbar -->
    <div
      class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3"
    >
      <div class="flex flex-wrap items-center gap-3">
        <!-- Filter Tanggal -->
        <select
          v-model="filterPemasukan.date"
          class="border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50 font-semibold text-slate-700 outline-none focus:border-emerald-500"
        >
          <option value="ALL">Semua Tanggal</option>
          <option v-for="d in availableDatesPemasukan" :key="d" :value="d">
            {{ d }}
          </option>
        </select>

        <!-- Filter Kas / Bank -->
        <select
          v-model="filterPemasukan.bank"
          class="border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50 font-semibold text-slate-700 outline-none focus:border-emerald-500"
        >
          <option value="ALL">Semua Kas/Bank</option>
          <option v-for="b in availableBanksPemasukan" :key="b" :value="b">
            {{ b }}
          </option>
        </select>

        <!-- Search Input dengan Tombol Clear -->
        <div class="relative">
          <input
            type="text"
            v-model="filterPemasukan.search"
            placeholder="Cari uraian, pos, COA..."
            class="border border-slate-200 rounded-xl pl-3 pr-8 py-1.5 text-xs w-64 bg-slate-50 outline-none focus:border-emerald-500"
          />
          <span
            v-if="filterPemasukan.search"
            @click="filterPemasukan.search = ''"
            class="absolute right-2.5 top-1.5 text-xs text-slate-400 cursor-pointer hover:text-slate-600 font-bold"
            >✕</span
          >
        </div>
      </div>

      <!-- Tombol Download Excel -->
      <button
        @click="exportPemasukanExcel"
        class="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl font-bold shadow-xs transition flex items-center gap-1.5"
      >
        <span>📥 Download Excel Jurnal Pemasukan</span>
      </button>
    </div>

    <!-- Main Pemasukan Table (Layout Proporsional) -->
    <div
      class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-xs">
          <thead
            class="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200"
          >
            <tr>
              <th class="px-3 py-3 text-left w-32">Tanggal & Bank</th>
              <th class="px-3 py-3 text-left w-64 text-emerald-900">
                COA Penerimaan (Kredit)
              </th>
              <!-- KOLOM UTAMA: DIBUAT PALING LEBAR -->
              <th class="px-4 py-3 text-left">
                Uraian Jurnal Terbentuk (Debet Kas/Bank ➔ Kredit COA)
              </th>
              <th class="px-2 py-3 text-center w-16">Trx</th>
              <th class="px-4 py-3 text-right w-36">Total Nominal (Rp)</th>
              <th class="px-3 py-3 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="item in filteredPemasukan"
              :key="item.id"
              :class="
                item.justCopied
                  ? 'bg-emerald-100/70 font-medium'
                  : item.wasCopied
                    ? 'bg-emerald-50/60 font-medium'
                    : 'hover:bg-slate-50/80'
              "
              class="transition"
            >
              <!-- 1. Tanggal & Kas/Bank (Ringkas Stacked) -->
              <td class="px-3 py-2.5 whitespace-nowrap">
                <div class="font-mono font-bold text-slate-700 text-xs">
                  {{ item.tglFormatted }}
                </div>
                <div class="mt-1">
                  <span
                    class="text-[10px] font-bold px-2 py-0.5 rounded-md inline-block"
                    :class="{
                      'bg-teal-50 text-teal-800 border border-teal-200':
                        item.kasBank === 'BSI' || item.kasBank.includes('BSI'),
                      'bg-purple-50 text-purple-800 border border-purple-200':
                        item.kasBank === 'Muamalat' ||
                        item.kasBank.includes('Muamalat'),
                      'bg-slate-100 text-slate-800 border border-slate-200':
                        item.kasBank.includes('Kas'),
                    }"
                  >
                    {{ item.kasBank }}
                  </span>
                </div>
              </td>

              <!-- 2. COA Penerimaan + Pos Asli & Kategori Akrual Ringkas -->
              <td class="px-3 py-2.5">
                <div
                  @click="openEditModal(item, 'pemasukan')"
                  class="bg-emerald-50/80 hover:bg-emerald-100/90 border border-emerald-200/70 p-2 rounded-xl cursor-pointer transition group"
                  title="Klik untuk ubah COA"
                >
                  <div class="flex items-center justify-between">
                    <span
                      class="font-bold text-emerald-950 text-[11px] leading-tight"
                    >
                      {{ item.coaBaru }}
                    </span>
                    <span
                      class="text-[9px] text-emerald-600 opacity-0 group-hover:opacity-100 transition shrink-0 ml-1"
                      >✏️ Edit</span
                    >
                  </div>
                  <!-- Sub-info: Pos Asli & Kategori Akrual -->
                  <div
                    class="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500"
                  >
                    <span
                      class="truncate max-w-[140px]"
                      :title="`Pos Asli: ${item.posPenerimaan}`"
                    >
                      📁 {{ item.posPenerimaan }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- 3. URAIAN JURNAL TERBENTUK (LELUASA & JELAS) -->
              <td class="px-4 py-2.5">
                <div class="space-y-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <!-- Badge Kategori Akrual -->
                    <span
                      class="px-2 py-0.5 rounded text-[9px] font-bold border uppercase shrink-0"
                      :class="{
                        'bg-emerald-100 text-emerald-800 border-emerald-300':
                          item.kategori === 'TAPEL SEKARANG',
                        'bg-amber-100 text-amber-800 border-amber-300':
                          item.kategori === 'TAPEL AKAN DATANG' ||
                          item.kategori === 'BULAN DEPAN',
                        'bg-sky-100 text-sky-800 border-sky-300':
                          item.kategori === 'TAPEL LALU' ||
                          item.kategori === 'BULAN LALU',
                      }"
                    >
                      {{ item.kategori }}
                    </span>

                    <!-- Teks Uraian Bebas & Jelas -->
                    <span
                      @click="openEditModal(item, 'pemasukan')"
                      class="text-slate-900 font-medium text-xs hover:text-emerald-700 cursor-pointer transition leading-relaxed"
                      title="Klik untuk ubah uraian jurnal"
                    >
                      {{ item.uraianJurnal }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- 4. Jumlah Transaksi -->
              <td
                class="px-2 py-2.5 text-center font-mono font-bold text-slate-600"
              >
                {{ item.jmlTrans }}
              </td>

              <!-- 5. Total Nominal (Klik untuk Salin) -->
              <td
                @click="copyNominal(item.totalPenerimaan)"
                class="px-4 py-2.5 text-right font-mono font-bold text-slate-900 cursor-pointer hover:bg-emerald-100/50 transition rounded whitespace-nowrap text-xs"
                title="Klik untuk salin nominal"
              >
                {{ formatRupiah(item.totalPenerimaan) }}
              </td>

              <!-- 6. Aksi (Edit & Copy) -->
              <td class="px-3 py-2.5 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button
                    @click="openEditModal(item, 'pemasukan')"
                    class="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg text-[10px] font-semibold transition"
                    title="Edit COA & Uraian"
                  >
                    ✏️
                  </button>
                  <button
                    @click="handlePemasukanRowAction(item)"
                    :class="
                      item.justCopied
                        ? 'bg-emerald-600 text-white'
                        : item.wasCopied
                          ? 'bg-emerald-800 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                    "
                    class="px-2.5 py-1 text-[10px] rounded-lg font-semibold transition min-w-[55px]"
                    title="Salin Payload Jurnal Pemasukan"
                  >
                    {{
                      item.justCopied ? "✓" : item.wasCopied ? "Lagi" : "Copy"
                    }}
                  </button>
                </div>
              </td>
            </tr>

            <!-- Jika Data Kosong -->
            <tr v-if="filteredPemasukan.length === 0">
              <td colspan="6" class="p-12 text-center text-slate-400">
                Tidak ada data penerimaan siswa yang sesuai filter.
              </td>
            </tr>
          </tbody>

          <!-- Footer Total -->
          <tfoot
            class="bg-slate-50 font-bold border-t border-slate-200 text-slate-900"
          >
            <tr>
              <td
                colspan="3"
                class="px-4 py-3.5 text-right uppercase text-[10px] text-slate-500 font-semibold"
              >
                Total Terfilter
              </td>
              <td class="px-2 py-3.5 text-center font-mono text-slate-700">
                {{ totalTransPemasukan }}
              </td>
              <td
                class="px-4 py-3.5 text-right font-mono text-xs text-emerald-950 font-bold"
              >
                {{ formatRupiah(totalNominalPemasukan) }}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useFinance } from "../composables/useFinance.js";
import { formatRupiah } from "../utils/formatters.js";

const {
  filterPemasukan,
  availableDatesPemasukan,
  availableBanksPemasukan,
  filteredPemasukan,
  exportPemasukanExcel,
  copyNominal,
  handlePemasukanRowAction,
  totalTransPemasukan,
  totalNominalPemasukan,
  openEditModal,
} = useFinance();
</script>
