<template>
  <section class="space-y-4">
    <!-- Filter & Search Toolbar -->
    <div
      class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3"
    >
      <div class="flex flex-wrap items-center gap-2.5">
        <select
          v-model="filterPengeluaran.date"
          class="border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50 font-semibold text-slate-700 outline-none focus:border-emerald-500"
        >
          <option value="ALL">Semua Tanggal</option>
          <option v-for="d in availableDatesPengeluaran" :key="d" :value="d">
            {{ d }}
          </option>
        </select>

        <select
          v-model="filterPengeluaran.kasBank"
          class="border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50 font-semibold text-slate-700 outline-none focus:border-emerald-500"
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

        <select
          v-model="filterPengeluaran.sourceType"
          class="border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50 font-semibold text-slate-700 outline-none focus:border-emerald-500"
        >
          <option value="ALL">Semua Sumber</option>
          <option value="KAS_TUNAI">💵 Kas Tunai Saja</option>
          <option value="MATCHED_BANK">✓ Match Bank Riil</option>
          <option value="UNRECORDED_BANK">⚡ Belum Dicatat Kasir</option>
          <option value="MERGED">🔗 Hasil Merge</option>
        </select>

        <div class="relative">
          <input
            type="text"
            v-model="filterPengeluaran.search"
            placeholder="Cari uraian, nama, akun..."
            class="border border-slate-200 rounded-xl pl-3 pr-8 py-1.5 text-xs w-60 bg-slate-50 outline-none focus:border-emerald-500"
          />
          <span
            v-if="filterPengeluaran.search"
            @click="filterPengeluaran.search = ''"
            class="absolute right-2.5 top-1.5 text-xs text-slate-400 cursor-pointer hover:text-slate-600"
            >✕</span
          >
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="hiddenPengeluaranCount > 0"
          @click="restoreHiddenPengeluaran"
          class="text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl font-semibold transition"
        >
          Pulihkan Tersembunyi ({{ hiddenPengeluaranCount }})
        </button>
        <button
          @click="exportPengeluaranExcel"
          class="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl font-bold shadow-xs transition flex items-center gap-1.5"
        >
          <span>📥 Download Excel</span>
        </button>
      </div>
    </div>

    <!-- Main Pengeluaran Table -->
    <div
      class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-xs">
          <thead
            class="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200"
          >
            <tr>
              <th class="px-3 py-3 text-center w-24">Status / Pilih</th>
              <th class="px-3 py-3 text-left w-32">Tanggal & Akun</th>
              <th class="px-3 py-3 text-left w-36">Penerima</th>
              <th class="px-3 py-3 text-left w-52 text-emerald-900">
                COA Pembebanan
              </th>
              <th class="px-4 py-3 text-left">Uraian Transaksi Standar</th>
              <th class="px-3 py-3 text-right w-28">Debit (Rp)</th>
              <th class="px-3 py-3 text-right w-28">Kredit (Rp)</th>
              <th class="px-3 py-3 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="item in filteredPengeluaran"
              :key="item.id"
              class="hover:bg-slate-50/80 transition"
            >
              <!-- 1. Status / Pilih -->
              <td class="px-3 py-2.5 text-center">
                <div class="flex flex-col items-center justify-center gap-1">
                  <span
                    v-if="item.isGenerated"
                    class="text-emerald-700 font-bold text-[9px] bg-emerald-100 px-2 py-0.5 rounded-full"
                    >LPJ BALANCING</span
                  >
                  <span
                    v-else-if="item.isMergedGroup"
                    class="text-indigo-700 font-bold text-[9px] bg-indigo-100 px-2 py-0.5 rounded-full"
                    >MERGED</span
                  >
                  <div v-else class="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      v-model="item.selected"
                      v-show="!item.groupId"
                      class="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span
                      v-show="item.groupId"
                      class="text-sky-500 font-bold text-[10px]"
                      >🔗</span
                    >
                  </div>

                  <!-- Badge Status Sumber & Tombol Copy Bundle LPJ -->
                  <div
                    v-if="item.groupId"
                    class="text-[9px] flex flex-col items-center gap-1 mt-0.5"
                  >
                    <span
                      class="bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-bold"
                      >{{ item.groupId }}</span
                    >
                    <button
                      @click="handleCopyLPJBundle(item.groupId)"
                      class="text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-1.5 py-0.5 rounded shadow-xs transition"
                      title="Salin semua baris LPJ sekaligus"
                    >
                      📋 Copy LPJ
                    </button>
                    <button
                      v-if="!item.isGenerated"
                      @click="ungroupLPJ(item.groupId)"
                      class="text-[8px] text-rose-500 hover:underline"
                    >
                      Lepas
                    </button>
                  </div>

                  <div v-else-if="item.isMergedGroup" class="text-[9px]">
                    <button
                      @click="unmergeGroup(item.mergeId)"
                      class="text-[9px] text-rose-500 hover:underline"
                    >
                      Pisah ({{ item.mergedCount }})
                    </button>
                  </div>
                  <div v-else>
                    <span
                      v-if="item.matchedBridge"
                      @click="openBankDetail(item)"
                      class="bg-emerald-100 text-emerald-800 font-bold text-[8px] px-1.5 py-0.5 rounded cursor-pointer hover:bg-emerald-200 transition whitespace-nowrap block"
                    >
                      ✓ Match Bank
                    </span>
                    <span
                      v-else-if="item.isDirectBankOutflow"
                      @click="openBankDetail(item)"
                      class="bg-amber-100 text-amber-900 font-bold text-[8px] px-1.5 py-0.5 rounded cursor-pointer hover:bg-amber-200 transition whitespace-nowrap block"
                    >
                      ⚡ Belum Kasir
                    </span>
                    <span v-else class="text-slate-400 text-[9px] block"
                      >💵 Tunai</span
                    >
                  </div>
                </div>
              </td>

              <!-- 2. Tanggal & Akun Kas/Bank -->
              <td class="px-3 py-2.5 whitespace-nowrap">
                <div class="font-mono font-bold text-slate-700 text-xs">
                  {{ item.tanggal }}
                </div>
                <div class="mt-1">
                  <span
                    class="text-[10px] font-bold px-2 py-0.5 rounded-md inline-block"
                    :class="{
                      'bg-teal-50 text-teal-800 border border-teal-200':
                        item.kasBank === 'Bank BSI',
                      'bg-purple-50 text-purple-800 border border-purple-200':
                        item.kasBank === 'Bank Muamalat',
                      'bg-slate-100 text-slate-800 border border-slate-200':
                        item.kasBank.includes('Kas'),
                    }"
                  >
                    {{ item.kasBank }}
                  </span>
                </div>
              </td>

              <!-- 3. Penerima -->
              <td class="px-3 py-2.5">
                <div
                  v-if="item.nama && item.nama !== '-'"
                  class="flex items-center gap-1.5 text-slate-700 font-semibold truncate max-w-[130px]"
                  :title="item.nama"
                >
                  <span class="text-slate-400">👤</span>
                  <span class="truncate">{{ item.nama }}</span>
                </div>
                <span v-else class="text-slate-300">-</span>
              </td>

              <!-- 4. COA Pembebanan (Klik untuk Edit) -->
              <td class="px-3 py-2.5">
                <div
                  @click="openEditModal(item, 'pengeluaran')"
                  class="bg-emerald-50/80 hover:bg-emerald-100/90 border border-emerald-200/70 p-1.5 rounded-lg max-w-[210px] cursor-pointer transition group"
                  title="Klik untuk ubah COA"
                >
                  <div class="flex items-center justify-between">
                    <span
                      class="font-mono font-bold text-emerald-950 text-[11px] leading-none"
                      >{{ item.kodeAkun }}</span
                    >
                    <span
                      class="text-[9px] text-emerald-600 opacity-0 group-hover:opacity-100 transition"
                      >✏️ Edit</span
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

              <!-- 5. Uraian Transaksi (Klik untuk Edit) -->
              <td class="px-4 py-2.5">
                <div class="space-y-1">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span
                      class="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase"
                      :class="getCategoryBadge(item).bg"
                    >
                      {{ getCategoryBadge(item).label }}
                    </span>
                    <span
                      @click="openEditModal(item, 'pengeluaran')"
                      class="text-slate-900 font-medium text-xs hover:text-emerald-700 cursor-pointer transition"
                      title="Klik untuk ubah deskripsi/uraian"
                    >
                      {{ item.uraian }}
                    </span>
                    <button
                      v-if="item.bankRawDescription"
                      @click="openBankDetail(item)"
                      class="text-sky-600 hover:text-sky-800 text-[10px] font-bold bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 shrink-0"
                      title="Rincian Mutasi Asli Rekening Koran"
                    >
                      ℹ️ Bank
                    </button>
                  </div>
                </div>
              </td>

              <!-- 6. Debit -->
              <td
                @click="copyNominal(item.debet)"
                class="px-3 py-2.5 text-right font-mono cursor-pointer hover:bg-emerald-100/50 transition rounded font-semibold whitespace-nowrap"
                :class="item.debet < 0 ? 'text-rose-600' : 'text-slate-800'"
                title="Klik untuk salin Debit"
              >
                {{ formatRupiah(item.debet) }}
              </td>

              <!-- 7. Kredit -->
              <td
                @click="copyNominal(item.kredit)"
                class="px-3 py-2.5 text-right font-mono cursor-pointer hover:bg-emerald-100/50 transition rounded font-semibold whitespace-nowrap"
                :class="item.kredit < 0 ? 'text-rose-600' : 'text-slate-800'"
                title="Klik untuk salin Kredit"
              >
                {{ formatRupiah(item.kredit) }}
              </td>

              <!-- 8. Kolom Aksi -->
              <td class="px-3 py-2.5 text-center">
                <!-- Tombol tetap tampil meskipun item berada dalam grup LPJ -->
                <div
                  v-if="!item.selected"
                  class="flex items-center justify-center gap-1"
                >
                  <button
                    v-if="!item.isGenerated"
                    @click="openEditModal(item, 'pengeluaran')"
                    class="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1 rounded-lg text-[10px] font-semibold transition"
                    title="Edit COA & Deskripsi"
                  >
                    ✏️
                  </button>
                  <button
                    @click="
                      item.groupId
                        ? handleCopyLPJBundle(item.groupId)
                        : handlePengeluaranRowAction(item)
                    "
                    :class="
                      item.justCopied
                        ? 'bg-emerald-600 text-white'
                        : item.wasCopied
                          ? 'bg-emerald-800 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                    "
                    class="px-2 py-1 text-[10px] rounded-lg font-semibold transition min-w-[55px]"
                    :title="
                      item.groupId
                        ? 'Salin 1 Paket LPJ'
                        : 'Salin Payload Jurnal'
                    "
                  >
                    {{
                      item.justCopied
                        ? "✓"
                        : item.wasCopied
                          ? "Lagi"
                          : item.groupId
                            ? "LPJ"
                            : "Copy"
                    }}
                  </button>
                  <button
                    v-if="!item.isGenerated"
                    @click="hidePengeluaranRow(item)"
                    class="text-slate-400 hover:text-rose-600 p-1 transition"
                    title="Sembunyikan"
                  >
                    ✕
                  </button>
                </div>
                <span v-else class="text-slate-300">-</span>
              </td>
            </tr>

            <tr v-if="filteredPengeluaran.length === 0">
              <td colspan="8" class="p-12 text-center text-slate-400">
                Tidak ada data pengeluaran yang sesuai filter.
              </td>
            </tr>
          </tbody>
          <tfoot
            class="bg-slate-50 font-bold border-t border-slate-200 text-slate-900"
          >
            <tr>
              <td
                colspan="5"
                class="px-4 py-3.5 text-right uppercase text-[10px] text-slate-500 font-semibold"
              >
                Total Terfilter
              </td>
              <td class="px-3 py-3.5 text-right font-mono text-xs">
                {{ formatRupiah(totalDebitPengeluaran) }}
              </td>
              <td class="px-3 py-3.5 text-right font-mono text-xs">
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

<script setup>
import { useFinance } from "../composables/useFinance.js";
import { formatRupiah, getCategoryBadge } from "../utils/formatters.js";

const {
  filterPengeluaran,
  availableDatesPengeluaran,
  availableKasBanksPengeluaran,
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
} = useFinance();

const openBankDetail = (item) => {
  selectedBankDetailItem.value = item;
  showBankDetailModal.value = true;
};
</script>
