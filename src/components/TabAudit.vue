<template>
  <section class="space-y-4">
    <div
      class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3"
    >
      <div>
        <h2 class="text-sm font-bold text-slate-800">
          Log Audit Rekonsiliasi & Eliminasi 3-Arah
        </h2>
        <p class="text-xs text-slate-500 mt-0.5">
          Sistem otomatis mengeliminasi <b>2 baris semu kasir</b> (Tambahan Kas
          Bank & Realisasi Belanja Kas Kecil) dan mempertahankan
          <b>1 baris riil bank</b> dengan keterangan belanja kasir.
        </p>
      </div>
      <span
        class="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl"
      >
        {{ eliminatedBridges.length }} Transaksi Berhasil Direkonsiliasi
      </span>
    </div>

    <!-- Main Audit Table -->
    <div
      class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-xs">
          <thead
            class="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200"
          >
            <tr>
              <th class="px-3 py-3 text-left w-32">Tgl & Bank Riil</th>
              <th class="px-4 py-3 text-left">1. Mutasi Riil Bank (Aktif)</th>
              <th class="px-3 py-3 text-right w-28">Nominal (Rp)</th>
              <th class="px-3 py-3 text-center w-24">Selisih Libur</th>
              <th class="px-4 py-3 text-left text-rose-800">
                2. Realisasi Kasir (Dieliminasi)
              </th>
              <th class="px-4 py-3 text-left text-slate-500">
                3. Tambahan Kasir (Dieliminasi)
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="log in eliminatedBridges"
              :key="log.id"
              class="hover:bg-slate-50/80"
            >
              <!-- Tanggal Bank -->
              <td class="px-3 py-2.5 whitespace-nowrap">
                <div class="font-mono font-bold text-emerald-900">
                  {{ log.bankTanggal }}
                </div>
                <span
                  class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 mt-0.5 inline-block"
                >
                  {{ log.kasBank }}
                </span>
              </td>

              <!-- Mutasi Riil Bank (Aktif) -->
              <td class="px-4 py-2.5">
                <div class="font-semibold text-slate-900 leading-snug">
                  {{
                    log.creditExpenseUraian !== "-"
                      ? log.creditExpenseUraian
                      : log.bankUraian
                  }}
                </div>
                <div
                  class="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-sm"
                  :title="log.bankUraian"
                >
                  Asli Bank: {{ log.bankUraian }}
                </div>
              </td>

              <!-- Nominal -->
              <td
                class="px-3 py-2.5 text-right font-mono font-bold text-slate-800 whitespace-nowrap"
              >
                {{ formatRupiah(log.nominal) }}
              </td>

              <!-- Selisih Hari (Jumat-Senin dsb) -->
              <td class="px-3 py-2.5 text-center whitespace-nowrap">
                <span
                  class="px-2 py-0.5 rounded-full font-bold text-[9px]"
                  :class="
                    log.dateDiffDays === 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  "
                >
                  {{
                    log.dateDiffDays === 0
                      ? "Sama Tgl"
                      : "Δ " + log.dateDiffDays + " Hari"
                  }}
                </span>
              </td>

              <!-- Realisasi Belanja Kasir (Dieliminasi) -->
              <td class="px-4 py-2.5 bg-rose-50/20">
                <div
                  class="line-through text-slate-600 font-medium leading-snug"
                >
                  {{ log.creditExpenseUraian }}
                </div>
                <div
                  class="flex items-center gap-1.5 mt-1 text-[10px] flex-wrap"
                >
                  <span
                    class="text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200"
                  >
                    Tgl Kasir: {{ log.creditExpenseTanggal }}
                  </span>
                  <span
                    v-if="
                      log.creditExpenseNama && log.creditExpenseNama !== '-'
                    "
                    class="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded"
                  >
                    👤 {{ log.creditExpenseNama }}
                  </span>
                  <span
                    class="text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded"
                  >
                    📁 {{ log.creditExpenseCOA }}
                  </span>
                </div>
              </td>

              <!-- Tambahan Kas Bank Kasir (Dieliminasi) -->
              <td class="px-4 py-2.5 text-slate-400">
                <div class="line-through leading-snug">
                  {{ log.debitBridgeUraian }}
                </div>
                <span
                  class="text-[10px] text-slate-400 font-mono mt-0.5 inline-block"
                >
                  Tgl Masuk: {{ log.debitBridgeTanggal }}
                </span>
              </td>
            </tr>

            <tr v-if="eliminatedBridges.length === 0">
              <td colspan="6" class="p-12 text-center text-slate-400">
                Belum ada jembatan transfer yang tereliminasi. Pastikan Buku
                Besar dan CSV Bank terpasang.
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

const { eliminatedBridges } = useFinance();
</script>
