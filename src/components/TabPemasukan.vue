<template>
  <section class="space-y-4">
    <div
      class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3"
    >
      <div class="flex flex-wrap items-center gap-3">
        <select
          v-model="filterPemasukan.date"
          class="border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50 font-semibold text-slate-700 outline-none focus:border-emerald-500"
        >
          <option value="ALL">Semua Tanggal</option>
          <option v-for="d in availableDatesPemasukan" :key="d" :value="d">
            {{ d }}
          </option>
        </select>
        <select
          v-model="filterPemasukan.bank"
          class="border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50 font-semibold text-slate-700 outline-none focus:border-emerald-500"
        >
          <option value="ALL">Semua Kas/Bank</option>
          <option v-for="b in availableBanksPemasukan" :key="b" :value="b">
            {{ b }}
          </option>
        </select>
        <input
          type="text"
          v-model="filterPemasukan.search"
          placeholder="Cari pos, COA, uraian..."
          class="border border-slate-200 rounded-xl px-3 py-1.5 text-xs w-64 bg-slate-50 outline-none focus:border-emerald-500"
        />
      </div>

      <button
        @click="exportPemasukanExcel"
        class="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl font-bold shadow-xs transition flex items-center gap-1.5"
      >
        <span>📥 Download Excel Jurnal Pemasukan</span>
      </button>
    </div>

    <!-- Main Pemasukan Table (Full Height / Dijembreng) -->
    <div
      class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-xs">
          <thead
            class="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200"
          >
            <tr>
              <th class="px-3 py-3 text-left">Tanggal</th>
              <th class="px-3 py-3 text-left">Kas / Bank (Debet)</th>
              <th class="px-3 py-3 text-left">Pos Asli</th>
              <th class="px-3 py-3 text-left text-emerald-900">
                COA Baru (Kredit)
              </th>
              <th class="px-3 py-3 text-center">Kategori Akrual</th>
              <th class="px-3 py-3 text-left">Uraian Jurnal Terbentuk</th>
              <th class="px-2 py-3 text-center">Trx</th>
              <th class="px-3 py-3 text-right">Total Nominal (Rp)</th>
              <th class="px-3 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="item in filteredPemasukan"
              :key="item.id"
              :class="
                item.wasCopied
                  ? 'bg-emerald-50 font-medium'
                  : 'hover:bg-slate-50/80'
              "
              class="transition"
            >
              <td
                class="px-3 py-2.5 font-mono text-slate-600 whitespace-nowrap"
              >
                {{ item.tglFormatted }}
              </td>
              <td
                class="px-3 py-2.5 font-bold text-emerald-900 whitespace-nowrap"
              >
                {{ item.kasBank }}
              </td>
              <td class="px-3 py-2.5 text-slate-500">
                {{ item.posPenerimaan }}
              </td>

              <!-- COA Baru (Klik untuk Edit) -->
              <td class="px-3 py-2.5">
                <div
                  @click="openEditModal(item, 'pemasukan')"
                  class="font-semibold text-emerald-900 bg-emerald-50/60 hover:bg-emerald-100/80 p-1.5 rounded-lg cursor-pointer transition border border-emerald-200/50 flex items-center justify-between"
                  title="Klik untuk ganti COA Pemasukan"
                >
                  <span>{{ item.coaBaru }}</span>
                  <span class="text-[9px] text-emerald-600 ml-1">✏️</span>
                </div>
              </td>

              <td class="px-3 py-2.5 text-center">
                <span
                  class="px-2.5 py-0.5 rounded-full font-bold text-[9px]"
                  :class="{
                    'bg-emerald-100 text-emerald-800':
                      item.kategori === 'TAPEL SEKARANG',
                    'bg-amber-100 text-amber-800':
                      item.kategori === 'TAPEL AKAN DATANG' ||
                      item.kategori === 'BULAN DEPAN',
                    'bg-sky-100 text-sky-800':
                      item.kategori === 'TAPEL LALU' ||
                      item.kategori === 'BULAN LALU',
                  }"
                  >{{ item.kategori }}</span
                >
              </td>

              <!-- Uraian Jurnal (Klik untuk Edit) -->
              <td class="px-3 py-2.5 text-slate-700 max-w-sm truncate">
                <span
                  @click="openEditModal(item, 'pemasukan')"
                  class="hover:text-emerald-700 cursor-pointer transition"
                  title="Klik untuk ubah uraian jurnal"
                >
                  {{ item.uraianJurnal }}
                </span>
              </td>

              <td
                class="px-2 py-2.5 text-center font-mono font-bold text-slate-600"
              >
                {{ item.jmlTrans }}
              </td>
              <td
                @click="copyNominal(item.totalPenerimaan)"
                class="px-3 py-2.5 text-right font-mono font-bold text-slate-800 cursor-pointer hover:bg-emerald-100/50 transition rounded"
              >
                {{ formatRupiah(item.totalPenerimaan) }}
              </td>

              <td class="px-3 py-2.5 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button
                    @click="openEditModal(item, 'pemasukan')"
                    class="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1 rounded-lg text-[10px] font-semibold transition"
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
                    class="px-2.5 py-1 text-[10px] rounded-lg font-semibold transition"
                  >
                    {{
                      item.justCopied ? "✓" : item.wasCopied ? "Lagi" : "Copy"
                    }}
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredPemasukan.length === 0">
              <td colspan="9" class="p-12 text-center text-slate-400">
                Tidak ada data penerimaan siswa.
              </td>
            </tr>
          </tbody>
          <tfoot
            class="bg-slate-50 font-bold border-t border-slate-200 text-slate-900"
          >
            <tr>
              <td
                colspan="6"
                class="px-3 py-3.5 text-right uppercase text-[10px] text-slate-500 font-semibold"
              >
                Total Terfilter
              </td>
              <td class="px-2 py-3.5 text-center font-mono text-slate-700">
                {{ totalTransPemasukan }}
              </td>
              <td
                class="px-3 py-3.5 text-right font-mono text-xs text-emerald-900"
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
