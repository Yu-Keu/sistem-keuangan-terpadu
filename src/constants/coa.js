export const MASTER_COA_LIST = [
  // 1. ASET
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

  // 2. LIABILITAS
  { kode: "213010190", nama: "Pendapatan diterima Dimuka", isHeader: false },
  { kode: "213010199", nama: "Utang Jangka Pendek Lainnya", isHeader: false },
  { kode: "213010106", nama: "Dana Titipan Santri", isHeader: false },
  { kode: "213010108", nama: "Dana Titipan Tabungan Santri", isHeader: false },

  // 4. PENDAPATAN
  { kode: "421010101", nama: "Pendapatan IWS (Infaq Wali-Santri/Murid)", isHeader: false },
  { kode: "421010102", nama: "Pendapatan Pendaftaran PSB", isHeader: false },
  { kode: "421010103", nama: "Pendapatan Pembangunan-DU PSB", isHeader: false },
  { kode: "421010104", nama: "Pendapatan Tahunan-DU PSB", isHeader: false },
  { kode: "421010105", nama: "Pendapatan Perlengkapan-DU PSB", isHeader: false },
  { kode: "423010102", nama: "Pendapatan Bantuan-Sumbangan dan Lainnya", isHeader: false },
  { kode: "423010103", nama: "Penerimaan Kegiatan-Program", isHeader: false },
  { kode: "423010105", nama: "Pendapatan Lain", isHeader: false },

  // 5. BEBAN
  { kode: "521010104", nama: "Beban Pemeliharaan Markaz", isHeader: false },
  { kode: "521010107", nama: "Beban Listrik-Air-Gas Markaz", isHeader: false },
  { kode: "521010110", nama: "Beban Operasional Markaz", isHeader: false },
  { kode: "521010113", nama: "Beban Belanja Dapur Markaz", isHeader: false },
  { kode: "521010126", nama: "Beban Kegiatan-Program", isHeader: false },

  // 6. LAIN-LAIN
  { kode: "611010104", nama: "Pendapatan Administrasi Bank", isHeader: false },
  { kode: "621010101", nama: "Beban Administrasi Bank", isHeader: false }
];

export function determineCOA(posAsli, ketItem, kategoriAkrual) {
  const combined = `${String(posAsli || "")} ${String(ketItem || "")}`.toUpperCase();
  if (combined.includes("LAUNDRY") || combined.includes("HASIL USAHA") || combined.includes("PARKIR")) return "213010199 - Utang Jangka Pendek Lainnya";
  if (kategoriAkrual === "TAPEL AKAN DATANG" || kategoriAkrual === "BULAN DEPAN") return "213010190 - Pendapatan diterima Dimuka";
  if (kategoriAkrual === "TAPEL LALU" || kategoriAkrual === "BULAN LALU") {
    if (combined.includes("SPP") || combined.includes("IWS") || combined.includes("PONDOKAN")) return "112010101 - Piutang SPP";
  }
  if (combined.includes("SPP") || combined.includes("IWS") || combined.includes("PONDOKAN")) return "421010101 - Pendapatan IWS (Infaq Wali-Santri/Murid)";
  if (combined.includes("PSB") || combined.includes("PENDAFTARAN")) return "421010102 - Pendapatan Pendaftaran PSB";
  if (combined.includes("BANGUNAN") || combined.includes("PENGEMBANGAN")) return "421010103 - Pendapatan Pembangunan-DU PSB";
  if (combined.includes("DAFTAR ULANG") || combined.includes("BUKU") || combined.includes("UJIAN")) return "421010104 - Pendapatan Tahunan-DU PSB";
  if (combined.includes("SERAGAM")) return "421010105 - Pendapatan Perlengkapan-DU PSB";
  if (combined.includes("TABUNGAN")) return "213010108 - Dana Titipan Tabungan Santri";
  return "423010105 - Pendapatan Lain";
}

export function deduceBankExpenseCOA(text) {
  const u = String(text || "").toUpperCase();
  if (u.includes("PEMINDAHBUKUAN E-BANKING") || u.includes("BIAYA ADMIN") || u.includes("ADM") || u.includes("BIAYA BUKU CEK")) return { kode: "621010101", nama: "Beban Administrasi Bank" };
  if (u.includes("YAKULT") || u.includes("AYAM") || u.includes("DAGING") || u.includes("BERAS") || u.includes("DAPUR") || u.includes("GAS")) return { kode: "521010113", nama: "Beban Belanja Dapur Markaz" };
  if (u.includes("KAS BON") || u.includes("KASBON") || u.includes("PINJAMAN") || u.includes("UANG MUKA")) return { kode: "113020102", nama: "Uang Muka Markaz" };
  if (u.includes("CHEQUE WITHDRAWAL") || u.includes("TARIK TUNAI")) return { kode: "111010201", nama: "Kas Kecil Mahad Ibnu Taimiyah" };
  if (u.includes("LISTRIK") || u.includes("PLN")) return { kode: "521010107", nama: "Beban Listrik-Air-Gas Markaz" };
  if (u.includes("SERVICE") || u.includes("MAINTENANCE") || u.includes("POMPA")) return { kode: "521010104", nama: "Beban Pemeliharaan Markaz" };
  return { kode: "521010110", nama: "Beban Operasional Markaz" };
}
