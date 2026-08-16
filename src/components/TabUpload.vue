<template>
  <section class="space-y-6">
    <!-- Dropzone Auto Detect -->
    <div
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      class="border-2 border-dashed rounded-3xl p-8 text-center transition cursor-pointer"
      :class="
        isDragging
          ? 'border-emerald-500 bg-emerald-50/50'
          : 'border-slate-300 bg-white hover:border-slate-400'
      "
      @click="$refs.autoInput.click()"
    >
      <input
        type="file"
        ref="autoInput"
        multiple
        @change="handleAutoSelect"
        class="hidden"
        accept=".csv, .xlsx, .xls"
      />
      <div class="max-w-md mx-auto space-y-2">
        <div class="text-3xl">📥</div>
        <h3 class="text-sm font-bold text-slate-800">
          Tarik & Lepas File ke Sini (Auto-Detect)
        </h3>
        <p class="text-xs text-slate-500">
          Sistem otomatis mendeteksi <b>ACC-STATEMENT</b> (Muamalat),
          <b>Account Statement</b> (BSI), Buku Besar, dan Pemasukan Siswa.
        </p>
      </div>
    </div>

    <!-- 4 Explicit Cards (Tetap dipertahankan untuk upload manual) -->
    <div
      class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6"
    >
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900">
            Atau Pilih File Secara Manual
          </h2>
          <p class="text-xs text-slate-500">
            Gunakan tombol masing-masing jika ingin memasukkan berkas satu per
            satu.
          </p>
        </div>
        <span
          class="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200"
        >
          {{ uploadedFilesCount }}/4 Terpasang
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Buku Besar -->
        <div
          class="p-5 rounded-2xl border-2 transition flex flex-col justify-between space-y-4"
          :class="
            filesStatus.bukuBesar
              ? 'border-emerald-500 bg-emerald-50/20'
              : 'border-slate-200 bg-white'
          "
        >
          <div>
            <div class="flex justify-between items-center mb-1">
              <span
                class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >File 1 (Excel)</span
              >
              <span
                :class="
                  filesStatus.bukuBesar
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-500'
                "
                class="text-[10px] px-2.5 py-0.5 rounded-full font-semibold"
              >
                {{ filesStatus.bukuBesar ? "✓ TERPASANG" : "BELUM ADA" }}
              </span>
            </div>
            <h3 class="text-sm font-bold text-slate-800">
              Buku Besar / Kas Kecil
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Sheet "Buku Besar", data baris 8+.
            </p>
          </div>
          <div>
            <input
              type="file"
              ref="bukuBesarInput"
              @change="uploadBukuBesar($event.target.files[0])"
              accept=".xlsx, .xls"
              class="hidden"
            />
            <button
              @click="$refs.bukuBesarInput.click()"
              class="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-xs"
              :class="
                filesStatus.bukuBesar
                  ? 'bg-slate-800 text-white'
                  : 'bg-emerald-600 text-white'
              "
            >
              {{
                filesStatus.bukuBesar
                  ? "Ganti Buku Besar"
                  : "Pilih File Buku Besar"
              }}
            </button>
          </div>
        </div>

        <!-- BSI -->
        <div
          class="p-5 rounded-2xl border-2 transition flex flex-col justify-between space-y-4"
          :class="
            filesStatus.bsi
              ? 'border-emerald-500 bg-emerald-50/20'
              : 'border-slate-200 bg-white'
          "
        >
          <div>
            <div class="flex justify-between items-center mb-1">
              <span
                class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >File 2 (BSI CSV)</span
              >
              <span
                :class="
                  filesStatus.bsi
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-500'
                "
                class="text-[10px] px-2.5 py-0.5 rounded-full font-semibold"
              >
                {{ filesStatus.bsi ? "✓ TERPASANG" : "BELUM ADA" }}
              </span>
            </div>
            <h3 class="text-sm font-bold text-slate-800">
              Rekening Koran Bank BSI
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              File: <code>Account Statement - 2477946710...</code>
            </p>
          </div>
          <div>
            <input
              type="file"
              ref="bsiInput"
              @change="uploadBsiCsv($event.target.files[0])"
              accept=".csv"
              class="hidden"
            />
            <button
              @click="$refs.bsiInput.click()"
              class="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-xs"
              :class="
                filesStatus.bsi
                  ? 'bg-slate-800 text-white'
                  : 'bg-emerald-600 text-white'
              "
            >
              {{ filesStatus.bsi ? "Ganti CSV BSI" : "Pilih File CSV BSI" }}
            </button>
          </div>
        </div>

        <!-- Muamalat -->
        <div
          class="p-5 rounded-2xl border-2 transition flex flex-col justify-between space-y-4"
          :class="
            filesStatus.muamalat
              ? 'border-purple-500 bg-purple-50/20'
              : 'border-slate-200 bg-white'
          "
        >
          <div>
            <div class="flex justify-between items-center mb-1">
              <span
                class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >File 3 (Muamalat CSV)</span
              >
              <span
                :class="
                  filesStatus.muamalat
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-slate-100 text-slate-500'
                "
                class="text-[10px] px-2.5 py-0.5 rounded-full font-semibold"
              >
                {{ filesStatus.muamalat ? "✓ TERPASANG" : "BELUM ADA" }}
              </span>
            </div>
            <h3 class="text-sm font-bold text-slate-800">
              Rekening Koran Bank Muamalat
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              File: <code>ACC-STATEMENT-...</code> (Tgl Efektif)
            </p>
          </div>
          <div>
            <input
              type="file"
              ref="muamalatInput"
              @change="uploadMuamalatCsv($event.target.files[0])"
              accept=".csv"
              class="hidden"
            />
            <button
              @click="$refs.muamalatInput.click()"
              class="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-xs"
              :class="
                filesStatus.muamalat
                  ? 'bg-slate-800 text-white'
                  : 'bg-purple-700 text-white'
              "
            >
              {{
                filesStatus.muamalat
                  ? "Ganti CSV Muamalat"
                  : "Pilih File CSV Muamalat"
              }}
            </button>
          </div>
        </div>

        <!-- Pemasukan Siswa -->
        <div
          class="p-5 rounded-2xl border-2 transition flex flex-col justify-between space-y-4"
          :class="
            filesStatus.pemasukan
              ? 'border-emerald-500 bg-emerald-50/20'
              : 'border-slate-200 bg-white'
          "
        >
          <div>
            <div class="flex justify-between items-center mb-1">
              <span
                class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >File 4 (Excel Penerimaan)</span
              >
              <span
                :class="
                  filesStatus.pemasukan
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-500'
                "
                class="text-[10px] px-2.5 py-0.5 rounded-full font-semibold"
              >
                {{ filesStatus.pemasukan ? "✓ TERPASANG" : "BELUM ADA" }}
              </span>
            </div>
            <h3 class="text-sm font-bold text-slate-800">
              Laporan Penerimaan Siswa
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Rekap Pembayaran SPP / Tabungan.
            </p>
          </div>
          <div>
            <input
              type="file"
              ref="pemasukanInput"
              @change="uploadPemasukanExcel($event.target.files[0])"
              accept=".xlsx, .xls"
              class="hidden"
            />
            <button
              @click="$refs.pemasukanInput.click()"
              class="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-xs"
              :class="
                filesStatus.pemasukan
                  ? 'bg-slate-800 text-white'
                  : 'bg-emerald-600 text-white'
              "
            >
              {{
                filesStatus.pemasukan
                  ? "Ganti File Pemasukan"
                  : "Pilih File Pemasukan"
              }}
            </button>
          </div>
        </div>
      </div>

      <div
        class="pt-4 border-t border-slate-100 flex items-center justify-between"
      >
        <button
          @click="resetAll"
          class="text-xs font-medium text-rose-600 hover:underline"
        >
          Reset Semua Data
        </button>
        <button
          @click="activeTab = 'pengeluaran'"
          class="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition"
        >
          Buka Jurnal Pengeluaran →
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { useFinance } from "../composables/useFinance.js";

const isDragging = ref(false);
const {
  activeTab,
  filesStatus,
  uploadedFilesCount,
  uploadBukuBesar,
  uploadBsiCsv,
  uploadMuamalatCsv,
  uploadPemasukanExcel,
  resetAll,
} = useFinance();

const processFiles = (files) => {
  Array.from(files).forEach((file) => {
    const name = file.name.toUpperCase();
    if (
      name.includes("ACC-STATEMENT") ||
      (name.endsWith(".CSV") && name.includes("MUAMALAT"))
    ) {
      uploadMuamalatCsv(file);
    } else if (
      name.includes("ACCOUNT STATEMENT") ||
      (name.endsWith(".CSV") &&
        (name.includes("2477946710") || name.includes("BSI")))
    ) {
      uploadBsiCsv(file);
    } else if (name.endsWith(".XLSX") || name.endsWith(".XLS")) {
      if (
        name.includes("PENERIMAAN") ||
        name.includes("PEMASUKAN") ||
        name.includes("SISWA") ||
        name.includes("SPP")
      ) {
        uploadPemasukanExcel(file);
      } else {
        uploadBukuBesar(file);
      }
    }
  });
};

const handleDrop = (e) => {
  isDragging.value = false;
  if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
};

const handleAutoSelect = (e) => {
  if (e.target.files) processFiles(e.target.files);
};
</script>
