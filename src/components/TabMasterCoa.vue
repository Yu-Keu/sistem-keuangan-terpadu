<template>
  <section class="space-y-4">
    <div
      class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3"
    >
      <div>
        <h2 class="text-sm font-bold text-slate-800">
          Master Chart of Accounts (COA)
        </h2>
        <p class="text-xs text-slate-500">
          Struktur bagan akun standar Pesantren Yatim Ibnu Taimiyah.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <input
          type="text"
          v-model="coaSearchQuery"
          placeholder="Cari akun..."
          class="border border-slate-200 rounded-xl px-3 py-1.5 text-xs w-60 bg-slate-50 outline-none focus:border-emerald-500"
        />
        <span
          class="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200"
          >{{ filteredCOAList.length }} Akun</span
        >
      </div>
    </div>

    <!-- Main Master COA Table (Full Height / Dijembreng) -->
    <div
      class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-xs">
          <thead
            class="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200"
          >
            <tr>
              <th class="px-4 py-3 text-left w-44">Kode Akun</th>
              <th class="px-4 py-3 text-left">Nama Akun</th>
              <th class="px-4 py-3 text-center w-32">Klasifikasi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="coa in filteredCOAList"
              :key="coa.kode"
              :class="
                coa.isHeader
                  ? 'bg-slate-50/60 font-bold text-slate-900'
                  : 'hover:bg-slate-50 text-slate-700'
              "
            >
              <td
                class="px-4 py-2.5 font-mono"
                :class="
                  coa.isHeader
                    ? 'text-slate-900 font-extrabold'
                    : 'text-slate-600'
                "
              >
                {{ coa.kode }}
              </td>
              <td
                class="px-4 py-2.5"
                :class="coa.isHeader ? 'pl-4 uppercase tracking-wide' : 'pl-8'"
              >
                {{ coa.nama }}
              </td>
              <td class="px-4 py-2.5 text-center">
                <span
                  class="px-2 py-0.5 rounded-full text-[9px] font-bold"
                  :class="
                    coa.isHeader
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-emerald-100 text-emerald-800'
                  "
                >
                  {{ coa.isHeader ? "HEADER" : "POSTING" }}
                </span>
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

const { coaSearchQuery, filteredCOAList } = useFinance();
</script>
