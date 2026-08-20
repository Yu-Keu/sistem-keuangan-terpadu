// ==========================================
// 1. MASTER CHART OF ACCOUNTS (COA)
// ==========================================
export const MASTER_COA_LIST = [
  // --- 1. ASET ---
  { kode: "1110102", nama: "Kas Mahad Ibnu Taimiyah", isHeader: true },
  { kode: "111010201", nama: "Kas Kecil Mahad Ibnu Taimiyah", isHeader: false },
  { kode: "111010202", nama: "Kas Besar Mahad Ibnu Taimiyah", isHeader: false },
  { kode: "1110202", nama: "Bank Mahad Ibnu Taimiyah", isHeader: true },
  { kode: "111020201", nama: "BSI", isHeader: false },
  { kode: "111020202", nama: "Muamalat", isHeader: false },
  { kode: "1120101", nama: "Piutang Pendidikan", isHeader: true },
  { kode: "112010101", nama: "Piutang SPP", isHeader: false },
  { kode: "112010102", nama: "Piutang Pembangunan", isHeader: false },
  { kode: "112010103", nama: "Piutang Seragam", isHeader: false },
  { kode: "112010104", nama: "Piutang Perlengkapan", isHeader: false },
  { kode: "112010199", nama: "Piutang Pendidikan Lainnya", isHeader: false },
  { kode: "1120301", nama: "Piutang Non Pendidikan", isHeader: true },
  { kode: "112030101", nama: "Piutang Usaha (Tagihan)", isHeader: false },
  { kode: "112030102", nama: "Piutang Pegawai", isHeader: false },
  { kode: "112030103", nama: "Piutang Pihak Ke-3", isHeader: false },
  { kode: "112030104", nama: "Piutang Non Pendidikan Lainnya", isHeader: false },
  { kode: "1130201", nama: "Uang Muka Unit", isHeader: true },
  { kode: "113020101", nama: "Uang Muka Pusat", isHeader: false },
  { kode: "113020102", nama: "Uang Muka Markaz", isHeader: false },
  { kode: "1140101", nama: "Beban Dibayar Dimuka Pendidikan", isHeader: true },
  { kode: "114010101", nama: "Beban Program Dibayar Dimuka", isHeader: false },
  { kode: "114010102", nama: "Beban Operasional Dibayar Dimuka", isHeader: false },
  { kode: "1140102", nama: "Beban Dibayar Dimuka Non Pendidikan", isHeader: true },
  { kode: "114010201", nama: "Beban Asuransi Kendaraan Dibayar Dimuka", isHeader: false },
  { kode: "1160101", nama: "Persediaan", isHeader: true },
  { kode: "116010101", nama: "Persediaan", isHeader: false },
  { kode: "1170101", nama: "RAK Yayasan", isHeader: true },
  { kode: "117010101", nama: "RAK Yayasan", isHeader: false },
  { kode: "1170102", nama: "RAK Pesantren Ibnu Taimiyah", isHeader: true },
  { kode: "117010201", nama: "RAK Pesantren Ibnu Taimiyah", isHeader: false },
  { kode: "1220101", nama: "Aset Tetap", isHeader: true },
  { kode: "122010101", nama: "Tanah", isHeader: false },
  { kode: "122010102", nama: "Bangunan", isHeader: false },
  { kode: "122010103", nama: "Kendaraan", isHeader: false },
  { kode: "122010104", nama: "Peralatan Kantor", isHeader: false },
  { kode: "122010105", nama: "Peralatan Elektronik", isHeader: false },
  { kode: "1220201", nama: "Akumulasi Penyusutan", isHeader: true },
  { kode: "122020101", nama: "Ak. Penyusutan Bangunan", isHeader: false },
  { kode: "122020102", nama: "Ak. Penyusutan Kendaraan", isHeader: false },
  { kode: "122020103", nama: "Ak. Penyusutan Peralatan Kantor", isHeader: false },
  { kode: "122020104", nama: "Ak. Penyusutan Elektronik", isHeader: false },

  // --- 2. LIABILITAS / UTANG ---
  { kode: "2110101", nama: "Utang Pajak", isHeader: true },
  { kode: "211010101", nama: "Utang PPh Pasal 21", isHeader: false },
  { kode: "211010102", nama: "Utang PPh Pasal 23", isHeader: false },
  { kode: "211010103", nama: "Utang PPh Badan", isHeader: false },
  { kode: "2120101", nama: "Utang Jangka Pendek", isHeader: true },
  { kode: "212010101", nama: "Utang Operasional", isHeader: false },
  { kode: "212010102", nama: "Gaji yang Masih Harus Dibayar", isHeader: false },
  { kode: "212010199", nama: "Biaya yang Masih Harus Dibayar Lainnya", isHeader: false },
  { kode: "2130101", nama: "Utang Lain", isHeader: true },
  { kode: "213010101", nama: "Dana Titipan Yatim", isHeader: false },
  { kode: "213010102", nama: "Dana Titipan Top Up Tabungan", isHeader: false },
  { kode: "213010103", nama: "Dana Titipan Tabungan Pegawai", isHeader: false },
  { kode: "213010104", nama: "Dana Titipan Daurah", isHeader: false },
  { kode: "213010105", nama: "Dana Titipan LAZIS", isHeader: false },
  { kode: "213010106", nama: "Dana Titipan Santri", isHeader: false },
  { kode: "213010107", nama: "Dana Titipan Wali Santri - Fee VA", isHeader: false },
  { kode: "213010108", nama: "Dana Titipan Tabungan Santri", isHeader: false },
  { kode: "213010190", nama: "Pendapatan diterima Dimuka", isHeader: false },
  { kode: "213010199", nama: "Utang Jangka Pendek Lainnya", isHeader: false },

  // --- 3. ASET NETO / EKUITAS ---
  { kode: "3110201", nama: "Aset Neto dengan Pembatasan Pesantren", isHeader: true },
  { kode: "311020100", nama: "Aset Neto dengan Pembatasan Pesantren", isHeader: false },
  { kode: "3210201", nama: "Aset Neto Tanpa Pembatasan Pesantren", isHeader: true },
  { kode: "321020100", nama: "Aset Neto Tanpa Pembatasan Pesantren", isHeader: false },

  // --- 4. PENDAPATAN ---
  { kode: "4210101", nama: "Pendapatan Santri", isHeader: true },
  { kode: "421010101", nama: "Pendapatan IWS (Infaq Wali-Santri/Murid)", isHeader: false },
  { kode: "421010102", nama: "Pendapatan Pendaftaran PSB", isHeader: false },
  { kode: "421010103", nama: "Pendapatan Pembangunan-DU PSB", isHeader: false },
  { kode: "421010104", nama: "Pendapatan Tahunan-DU PSB", isHeader: false },
  { kode: "421010105", nama: "Pendapatan Perlengkapan-DU PSB", isHeader: false },
  { kode: "421010106", nama: "Pendapatan Tahunan-Kenaikan Kelas", isHeader: false },
  { kode: "421010107", nama: "Pendapatan Marhalah (9 & 12)", isHeader: false },
  { kode: "421010108", nama: "Pendapatan Laundry", isHeader: false },
  { kode: "4220101", nama: "Pendapatan Dana BOS", isHeader: true },
  { kode: "422010101", nama: "Pendapatan Dana BOS", isHeader: false },
  { kode: "4230101", nama: "Pendapatan Non Santri", isHeader: true },
  { kode: "423010101", nama: "Pendapatan Hibah Pendiri-Pengurus (Yayasan)", isHeader: false },
  { kode: "423010102", nama: "Pendapatan Bantuan-Sumbangan dan Lainnya", isHeader: false },
  { kode: "423010103", nama: "Penerimaan Kegiatan-Program", isHeader: false },
  { kode: "423010104", nama: "Pendapatan Hibah-Wakaf", isHeader: false },
  { kode: "423010105", nama: "Pendapatan Lain", isHeader: false },
  { kode: "423010106", nama: "Pendapatan Pemeliharaan-Sewa Kendaraan", isHeader: false },
  { kode: "423010107", nama: "Pendapatan Nisbah Unit Usaha", isHeader: false },

  // --- 5. BEBAN ---
  { kode: "5210101", nama: "Beban Pesantren", isHeader: true },
  { kode: "521010101", nama: "Beban Mukafaah Markaz", isHeader: false },
  { kode: "521010102", nama: "Beban Alawah Markaz", isHeader: false },
  { kode: "521010103", nama: "Beban Tunjangan Markaz", isHeader: false },
  { kode: "521010104", nama: "Beban Pemeliharaan Markaz", isHeader: false },
  { kode: "521010105", nama: "Beban ATK Markaz", isHeader: false },
  { kode: "521010106", nama: "Beban Perlengkapan Markaz", isHeader: false },
  { kode: "521010107", nama: "Beban Listrik-Air-Gas Markaz", isHeader: false },
  { kode: "521010108", nama: "Beban Internet-IT Markaz", isHeader: false },
  { kode: "521010109", nama: "Beban Transportasi-Akomodasi Markaz", isHeader: false },
  { kode: "521010110", nama: "Beban Operasional Markaz", isHeader: false },
  { kode: "521010111", nama: "Beban Konsumsi Markaz", isHeader: false },
  { kode: "521010112", nama: "Beban Sharing IWS Markaz", isHeader: false },
  { kode: "521010113", nama: "Beban Belanja Dapur Markaz", isHeader: false },
  { kode: "521010114", nama: "Beban Iuran-Pajak-Surat-Daftar Markaz", isHeader: false },
  { kode: "521010115", nama: "Beban Telepon-HP Markaz", isHeader: false },
  { kode: "521010116", nama: "Beban Bantuan-Sumbangan-Santunan Markaz", isHeader: false },
  { kode: "521010117", nama: "Beban Sewa Markaz", isHeader: false },
  { kode: "521010118", nama: "Beban Pelatihan-Dauroh Markaz", isHeader: false },
  { kode: "521010119", nama: "Beban Hadiah-Natura Markaz", isHeader: false },
  { kode: "521010120", nama: "Beban Percetakan Markaz", isHeader: false },
  { kode: "521010121", nama: "Beban Jamuan Tamu Markaz", isHeader: false },
  { kode: "521010122", nama: "Beban Tenaga Ahli-Jasa Markaz", isHeader: false },
  { kode: "521010123", nama: "Beban Iklan dan Promosi Markaz", isHeader: false },
  { kode: "521010124", nama: "Beban Pengiriman-Ekpedisi Markaz", isHeader: false },
  { kode: "521010125", nama: "Beban Bantuan-Sumbangan", isHeader: false },
  { kode: "521010126", nama: "Beban Kegiatan-Program", isHeader: false },
  { kode: "521010127", nama: "Beban Mukafaah", isHeader: false },
  { kode: "521010128", nama: "Beban Alawah", isHeader: false },
  { kode: "5220101", nama: "Beban Operasional", isHeader: true },
  { kode: "522010101", nama: "Beban Tunjangan Umum", isHeader: false },
  { kode: "522010102", nama: "Beban Tunjangan Perumahan", isHeader: false },
  { kode: "522010103", nama: "Beban Tunjangan Pendidikan", isHeader: false },
  { kode: "522010104", nama: "Beban Tunjangan Kesehatan", isHeader: false },
  { kode: "522010105", nama: "Beban Tunjangan Pernikahan", isHeader: false },
  { kode: "522010106", nama: "Beban Sewa", isHeader: false },
  { kode: "522010107", nama: "Beban Pemeliharaan", isHeader: false },
  { kode: "522010108", nama: "Beban ATK", isHeader: false },
  { kode: "522010109", nama: "Beban Percetakan", isHeader: false },
  { kode: "522010110", nama: "Beban Perlengkapan", isHeader: false },
  { kode: "522010111", nama: "Beban Listrik-Air-Gas (Energi)", isHeader: false },
  { kode: "522010112", nama: "Beban Telepon-HP", isHeader: false },
  { kode: "522010113", nama: "Beban Internet-IT", isHeader: false },
  { kode: "522010114", nama: "Beban Iuran-Pajak-Surat-Daftar-Langganan", isHeader: false },
  { kode: "522010115", nama: "Beban Transportasi dan Akomodasi", isHeader: false },
  { kode: "522010116", nama: "Beban Pengiriman-Ekspedisi", isHeader: false },
  { kode: "522010117", nama: "Beban Konsumsi", isHeader: false },
  { kode: "522010118", nama: "Beban Jamuan Tamu", isHeader: false },
  { kode: "522010119", nama: "Beban Hadiah dan Natura", isHeader: false },
  { kode: "522010120", nama: "Beban Bantuan-Sumbangan-Santunan", isHeader: false },
  { kode: "522010121", nama: "Beban Pelatihan-Dauroh", isHeader: false },
  { kode: "522010122", nama: "Beban Iklan dan Promosi", isHeader: false },
  { kode: "522010123", nama: "Beban Tenaga Ahli & Perizinan, Jasa", isHeader: false },
  { kode: "522010124", nama: "Beban Rapat", isHeader: false },
  { kode: "522010125", nama: "Beban Penyusutan Bangunan", isHeader: false },
  { kode: "522010126", nama: "Beban Penyusutan Mesin & Peralatan Khusus", isHeader: false },
  { kode: "522010127", nama: "Beban Penyusutan Mesin Kantor", isHeader: false },
  { kode: "522010128", nama: "Beban Penyusutan Mesin dan Peralatan Lainnya", isHeader: false },
  { kode: "522010129", nama: "Beban Penyusutan Mesin dan Peralatan Dapur", isHeader: false },
  { kode: "522010130", nama: "Beban Penyusutan Alat-alat Komunikasi", isHeader: false },
  { kode: "522010131", nama: "Beban Penyusutan Kendaraan Roda Dua", isHeader: false },
  { kode: "522010132", nama: "Beban Penyusutan Kendaraan Roda Empat", isHeader: false },
  { kode: "522010133", nama: "Beban Penyusutan Mebel dan Peralatan Kayu-Plastik", isHeader: false },
  { kode: "522010134", nama: "Beban Penyusutan Mebel dan Peralatan Logam", isHeader: false },
  { kode: "522010199", nama: "Beban Lain", isHeader: false },

  // --- 6. PENDAPATAN & BEBAN LAIN-LAIN ---
  { kode: "6110101", nama: "Pendapatan Lain-Lain", isHeader: true },
  { kode: "611010101", nama: "Laba (Rugi) Selisih Kurs", isHeader: false },
  { kode: "611010102", nama: "Pendapatan bunga bank", isHeader: false },
  { kode: "611010103", nama: "Pendapatan Fee VA Bank", isHeader: false },
  { kode: "611010104", nama: "Pendapatan Administrasi Bank", isHeader: false },
  { kode: "611010105", nama: "Pendapatan Bagi Hasil atau Bonus", isHeader: false },
  { kode: "611010106", nama: "Laba (Rugi) Penjualan Harta Tetap", isHeader: false },
  { kode: "6210101", nama: "Beban Lain-Lain", isHeader: true },
  { kode: "621010101", nama: "Beban Administrasi Bank", isHeader: false },
  { kode: "621010102", nama: "Beban Lainnya", isHeader: false },

  // --- 7. BEBAN PAJAK ---
  { kode: "7110101", nama: "Beban Pajak", isHeader: true },
  { kode: "711010101", nama: "Beban Pajak Badan", isHeader: false }
];

// ==========================================
// 2. DAFTAR KATA KUNCI & MAPPING
// ==========================================

// Kata kunci yang SELALU dialokasikan ke Utang Jangka Pendek Lainnya
const FORCE_UTANG_JANGKA_PENDEK_KEYS = [
  "LAUNDRY", 
  "HASIL USAHA", 
  "PARKIR", 
  "IFTHOR", 
  "XENDIT", 
  "TITIP TRANSFER", 
  "GUEST HOUSE"
];

// Mapping kata kunci pendapatan/penerimaan umum
const COA_REVENUE_MAP = [
  { 
    keys: ["SPP", "PONDOKAN", "IWS"], 
    coa: "421010101 - Pendapatan IWS (Infaq Wali-Santri/Murid)" 
  },
  { 
    keys: ["DONASI BAKSOS"], 
    coa: "423010102 - Pendapatan Bantuan-Sumbangan dan Lainnya" 
  },
  { 
    keys: ["SALAH TRANSFER"], 
    coa: "213010199 - Utang Jangka Pendek Lainnya" 
  },
  { 
    keys: ["PSB", "PENDAFTARAN"], 
    coa: "421010102 - Pendapatan Pendaftaran PSB" 
  },
  { 
    keys: ["WAKAF BANGUNAN", "BANGUNAN", "DANA PENGEMBANGAN", "PENGEMBANGAN", "UANG PANGKAL"], 
    coa: "421010103 - Pendapatan Pembangunan-DU PSB" 
  },
  { 
    keys: ["DAFTAR ULANG", "BUKU", "UJIAN", "PERPUSTAKAAN"], 
    coa: "421010104 - Pendapatan Tahunan-DU PSB" 
  },
  { 
    keys: ["SERAGAM", "PERLENGKAPAN", "PERLENGKAPAN ASRAMA", "PERLENGKAPAN SEKOLAH"], 
    coa: "421010105 - Pendapatan Perlengkapan-DU PSB" 
  },
  { 
    keys: ["KENAIKAN KELAS"], 
    coa: "421010106 - Pendapatan Tahunan-Kenaikan Kelas" 
  },
  { 
    keys: ["MARHALAH"], 
    coa: "421010107 - Pendapatan Marhalah (9 & 12)" 
  },
  { 
    keys: ["BIAYA KESEHATAN", "KESEHATAN"], 
    coa: "423010105 - Pendapatan Lain" 
  },
  { 
    keys: ["EKSTRAKURIKULER", "WISUDA"], 
    coa: "213010106 - Dana Titipan Santri" 
  },
  { 
    keys: ["TABUNGAN"], 
    coa: "213010108 - Dana Titipan Tabungan Santri" 
  },
  { 
    keys: ["KEGIATAN", "TPA"], 
    coa: "423010103 - Penerimaan Kegiatan-Program" 
  },
  { 
    keys: ["YATIM", "SUMBANGAN", "KAFALAH", "TPG", "CALISTUNG"], 
    coa: "423010102 - Pendapatan Bantuan-Sumbangan dan Lainnya" 
  },
  { 
    keys: ["HUTANG", "PIUTANG"], 
    coa: "112030102 - Piutang Pegawai" 
  },
  { 
    keys: ["PENDAPATAN BIAYA ADMIN", "BIAYA ADMIN"], 
    coa: "611010104 - Pendapatan Administrasi Bank" 
  }
];

// ==========================================
// 3. FUNGSI LOGIKA MAPPING
// ==========================================

/**
 * Menentukan COA berdasarkan Pos/Ket dan Status Akrual
 */
export function determineCOA(posAsli, ketItem, kategoriAkrual) {
  const combined = `${String(posAsli || "")} ${String(ketItem || "")}`.toUpperCase();

  // 0. Prioritas Utama: Forced ke Utang Jangka Pendek Lainnya
  for (const key of FORCE_UTANG_JANGKA_PENDEK_KEYS) {
    if (combined.includes(key)) {
      return "213010199 - Utang Jangka Pendek Lainnya";
    }
  }

  // 1. Logika Akrual: Pendapatan Diterima di Muka
  if (kategoriAkrual === "TAPEL AKAN DATANG" || kategoriAkrual === "BULAN DEPAN") {
    return "213010190 - Pendapatan diterima Dimuka";
  }

  // 2. Logika Akrual: Pelunasan Piutang / Tunggakan Periode Lalu
  if (kategoriAkrual === "TAPEL LALU" || kategoriAkrual === "BULAN LALU") {
    if (combined.includes("SPP") || combined.includes("IWS") || combined.includes("PONDOKAN")) {
      return "112010101 - Piutang SPP";
    }
    if (combined.includes("BANGUNAN") || combined.includes("PENGEMBANGAN")) {
      return "112010102 - Piutang Pembangunan";
    }
    if (combined.includes("SERAGAM")) {
      return "112010103 - Piutang Seragam";
    }
    if (combined.includes("PERLENGKAPAN")) {
      return "112010104 - Piutang Perlengkapan";
    }
  }

  // 3. Logika Pendapatan / Penerimaan Reguler
  for (const rule of COA_REVENUE_MAP) {
    for (const key of rule.keys) {
      if (combined.includes(key)) {
        return rule.coa;
      }
    }
  }

  // 4. Fallback Default jika tidak ada kata kunci yang cocok
  return "423010105 - Pendapatan Lain";
}

/**
 * Menentukan Akun Beban Bank berdasarkan mutasi deskripsi rekening
 */
export function deduceBankExpenseCOA(text) {
  const u = String(text || "").toUpperCase();

  if (u.includes("PEMINDAHBUKUAN E-BANKING") || u.includes("BIAYA ADMIN") || u.includes("ADM") || u.includes("BIAYA BUKU CEK")) {
    return { kode: "621010101", nama: "Beban Administrasi Bank" };
  }
  if (u.includes("YAKULT") || u.includes("AYAM") || u.includes("DAGING") || u.includes("BERAS") || u.includes("DAPUR") || u.includes("GAS")) {
    return { kode: "521010113", nama: "Beban Belanja Dapur Markaz" };
  }
  if (u.includes("KAS BON") || u.includes("KASBON") || u.includes("PINJAMAN") || u.includes("UANG MUKA")) {
    return { kode: "113020102", nama: "Uang Muka Markaz" };
  }
  if (u.includes("CHEQUE WITHDRAWAL") || u.includes("TARIK TUNAI")) {
    return { kode: "111010201", nama: "Kas Kecil Mahad Ibnu Taimiyah" };
  }
  if (u.includes("LISTRIK") || u.includes("PLN")) {
    return { kode: "521010107", nama: "Beban Listrik-Air-Gas Markaz" };
  }
  if (u.includes("SERVICE") || u.includes("MAINTENANCE") || u.includes("POMPA")) {
    return { kode: "521010104", nama: "Beban Pemeliharaan Markaz" };
  }

  return { kode: "521010110", nama: "Beban Operasional Markaz" };
}