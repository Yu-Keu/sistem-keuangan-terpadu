/**
 * ======================================================================
 * FILE: src/utils/exportExcel.js
 * GENERATOR EKSPOR EXCEL JURNAL STANDAR 8 KOLOM (DIPERBARUI)
 * ======================================================================
 */

import * as XLSX from "xlsx";

function downloadWorkbookFile(data, filenamePrefix) {
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
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
  const wsData = [["No Batch", "Tanggal", "Uraian Jurnal", "Kode Akun", "Nama Akun", "Posisi", "Debit", "Kredit"]];
  let batch = 1;
  const processedGroups = new Set();

  filteredData.forEach(item => {
    if (!item.groupId) {
      const isDebetEntry = item.debet > 0 && item.kredit === 0;
      const nom = isDebetEntry ? item.debet : item.kredit;
      
      const bankCode = item.kasBank === "Kas Kecil" ? "111010201" : (item.kasBank.includes("BSI") ? "111020201" : "111020202");
      const bankName = item.kasBank === "Kas Kecil" ? "Kas Kecil Mahad Ibnu Taimiyah" : (item.kasBank.includes("BSI") ? "BSI" : "Muamalat");

      if (isDebetEntry) {
        // Transaksi Masuk / Pelunasan Kasbon Tunggal: DEBIT Kas/Bank, KREDIT Akun Terkait
        wsData.push([batch, item.tanggal, item.uraian, bankCode, bankName, "DEBIT", nom, 0]);
        wsData.push([batch, item.tanggal, item.uraian, item.kodeAkun, item.namaAkun, "KREDIT", 0, nom]);
      } else {
        // Pengeluaran Beban Biasa: DEBIT Beban, KREDIT Kas/Bank
        wsData.push([batch, item.tanggal, item.uraian, item.kodeAkun, item.namaAkun, "DEBIT", nom, 0]);
        wsData.push([batch, item.tanggal, item.uraian, bankCode, bankName, "KREDIT", 0, nom]);
      }
      batch++;
    } else {
      if (processedGroups.has(item.groupId)) return;
      processedGroups.add(item.groupId);
      const gItems = filteredData.filter(x => x.groupId === item.groupId);
      
      gItems.forEach(g => {
        const isDebetEntry = g.debet > 0 && g.kredit === 0;
        const nom = isDebetEntry ? g.debet : g.kredit;

        if (g.isGenerated) {
          if (g.debet > 0) {
            wsData.push([batch, g.tanggal, g.uraian, g.kodeAkun, g.namaAkun, "DEBIT", nom, 0]);
          } else {
            wsData.push([batch, g.tanggal, g.uraian, g.kodeAkun, g.namaAkun, "KREDIT", 0, nom]);
          }
        } else {
          const isUangMukaKasbon = String(g.kodeAkun).startsWith("113") || 
                                   (g.bidang && (g.bidang.toLowerCase().includes("kasbon") || g.bidang.toLowerCase().includes("uang muka"))) ||
                                   g.uraian.toLowerCase().includes("pelunasan") ||
                                   isDebetEntry;

          if (isUangMukaKasbon) {
            wsData.push([batch, g.tanggal, g.uraian, g.kodeAkun, g.namaAkun, "KREDIT", 0, nom]);
          } else {
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
  const wsData = [["No Batch", "Tanggal", "Uraian Jurnal", "Kode Akun", "Nama Akun", "Posisi", "Debit", "Kredit"]];
  let batch = 1;

  filteredData.forEach(item => {
    const nom = Math.abs(item.totalPenerimaan);
    const bankCode = item.kasBank === "BSI" ? "111020201" : (item.kasBank === "Muamalat" ? "111020202" : "111010202");
    const bankName = item.kasBank === "BSI" ? "BSI" : (item.kasBank === "Muamalat" ? "Muamalat" : "Kas Besar Mahad Ibnu Taimiyah");
    const parts = item.coaBaru.split(" - ");
    const coaCode = parts[0] ? parts[0].trim() : "423010105";
    const coaName = parts[1] ? parts[1].trim() : item.coaBaru;

    wsData.push([batch, item.tglFormatted.replace(/-/g, '/'), item.uraianJurnal, bankCode, bankName, "DEBIT", nom, 0]);
    wsData.push([batch, item.tglFormatted.replace(/-/g, '/'), item.uraianJurnal, coaCode, coaName, "KREDIT", 0, nom]);
    batch++;
  });

  downloadWorkbookFile(wsData, "Jurnal_Pemasukan");
}