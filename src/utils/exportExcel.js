/**
 * ======================================================================
 * FILE: src/utils/exportExcel.js
 * GENERATOR EKSPOR EXCEL JURNAL STANDAR 8 KOLOM (100% DOUBLE ENTRY)
 * ======================================================================
 */

import * as XLSX from "xlsx";

function getBankDetails(kasBank) {
  const kb = String(kasBank || "").toLowerCase();
  if (kb.includes("bsi")) return { code: "111020201", name: "BSI" };
  if (kb.includes("muamalat")) return { code: "111020202", name: "Muamalat" };
  if (kb.includes("kas besar")) return { code: "111010202", name: "Kas Besar Mahad Ibnu Taimiyah" };
  return { code: "111010201", name: "Kas Kecil Mahad Ibnu Taimiyah" };
}

function downloadWorkbookFile(data, filenamePrefix) {
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [
    { wch: 10 }, { wch: 12 }, { wch: 55 }, { wch: 15 }, 
    { wch: 35 }, { wch: 10 }, { wch: 15 }, { wch: 15 }
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Jurnal Upload");
  const dStr = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `${filenamePrefix}_${dStr}.xlsx`);
}

export function exportPengeluaranToExcel(filteredData) {
  if (!filteredData || filteredData.length === 0) {
    alert("Tidak ada data pengeluaran!");
    return;
  }

  const wsData = [
    ["No Batch", "Tanggal", "Uraian Jurnal", "Kode Akun", "Nama Akun", "Posisi", "Debit", "Kredit"]
  ];
  let batch = 1;
  const processedGroups = new Set();

  filteredData.forEach(item => {
    // 1. TRANSAKSI BIASA (NON-LPJ)
    if (!item.groupId) {
      const isDebetEntry = item.debet > 0 && item.kredit === 0;
      const nom = Math.abs(isDebetEntry ? item.debet : item.kredit);
      const bank = getBankDetails(item.kasBank);

      if (isDebetEntry) {
        // Beban Biasa: DEBIT Beban, KREDIT Kas/Bank
        wsData.push([batch, item.tanggal, item.uraian, item.kodeAkun, item.namaAkun, "DEBIT", nom, 0]);
        wsData.push([batch, item.tanggal, item.uraian, bank.code, bank.name, "KREDIT", 0, nom]);
      } else {
        // Uang Masuk / Penutupan: DEBIT Kas/Bank, KREDIT Akun Lawan
        wsData.push([batch, item.tanggal, item.uraian, bank.code, bank.name, "DEBIT", nom, 0]);
        wsData.push([batch, item.tanggal, item.uraian, item.kodeAkun, item.namaAkun, "KREDIT", 0, nom]);
      }
      batch++;
    } 
    // 2. TRANSAKSI BUNDLE LPJ (MULTI-BARIS KASBON & BEBAN)
    else {
      if (processedGroups.has(item.groupId)) return;
      processedGroups.add(item.groupId);
      
      const gItems = filteredData.filter(x => x.groupId === item.groupId);

      gItems.forEach(g => {
        const nom = Math.abs(g.debet !== 0 ? g.debet : g.kredit);

        if (g.isGenerated) {
          // Baris penyeimbang kas/bank
          if (g.debet > 0) {
            wsData.push([batch, g.tanggal, g.uraian, g.kodeAkun, g.namaAkun, "DEBIT", nom, 0]);
          } else {
            wsData.push([batch, g.tanggal, g.uraian, g.kodeAkun, g.namaAkun, "KREDIT", 0, nom]);
          }
        } else {
          const isKasbon = String(g.kodeAkun).startsWith("113");
          if (isKasbon) {
            // Kasbon ditutup = KREDIT
            wsData.push([batch, g.tanggal, g.uraian, g.kodeAkun, g.namaAkun, "KREDIT", 0, nom]);
          } else {
            // Belanja riil = DEBIT
            wsData.push([batch, g.tanggal, g.uraian, g.kodeAkun, g.namaAkun, "DEBIT", nom, 0]);
          }
        }
      });
      batch++;
    }
  });

  downloadWorkbookFile(wsData, "Jurnal_Pengeluaran");
}

export function exportPemasukanToExcel(filteredData) {
  if (!filteredData || filteredData.length === 0) {
    alert("Tidak ada data pemasukan!");
    return;
  }
  const wsData = [
    ["No Batch", "Tanggal", "Uraian Jurnal", "Kode Akun", "Nama Akun", "Posisi", "Debit", "Kredit"]
  ];
  let batch = 1;

  filteredData.forEach(item => {
    const isNegative = (item.totalPenerimaan || 0) < 0;
    const nom = Math.abs(item.totalPenerimaan || 0);
    const bank = getBankDetails(item.kasBank);
    const parts = String(item.coaBaru || "").split(" - ");
    const coaCode = parts[0] ? parts[0].trim() : "423010105";
    const coaName = parts[1] ? parts[1].trim() : item.coaBaru;
    const tgl = (item.tglFormatted || "").replace(/-/g, '/');

    if (!isNegative) {
      // 1. Pemasukan Normal (Positif): DEBIT Kas/Bank, KREDIT Akun COA
      wsData.push([batch, tgl, item.uraianJurnal, bank.code, bank.name, "DEBIT", nom, 0]);
      wsData.push([batch, tgl, item.uraianJurnal, coaCode, coaName, "KREDIT", 0, nom]);
    } else {
      // 2. Koreksi/Minus (Negatif): DIBALIK -> DEBIT Akun COA, KREDIT Kas/Bank
      wsData.push([batch, tgl, item.uraianJurnal, coaCode, coaName, "DEBIT", nom, 0]);
      wsData.push([batch, tgl, item.uraianJurnal, bank.code, bank.name, "KREDIT", 0, nom]);
    }
    batch++;
  });

  downloadWorkbookFile(wsData, "Jurnal_Pemasukan");
}