/**
 * ======================================================================
 * FILE: src/utils/parsers.js
 * ======================================================================
 */

import * as XLSX from "xlsx";
import { parseIndonesianNumber, formatBankDateString } from "./formatters.js";
import { deduceBankExpenseCOA, determineCOA } from "../constants/coa.js";

export function parseCsvLine(text) {
  let p = '', r = [], q = false;
  for (let i = 0; i < text.length; i++) {
    let c = text[i];
    if (c === '"') {
      if (q && text[i + 1] === '"') { p += '"'; i++; }
      else { q = !q; }
    } else if (c === ',' && !q) {
      r.push(p.trim());
      p = '';
    } else {
      p += c;
    }
  }
  r.push(p.trim());
  return r.map(x => x.replace(/^"|"$/g, '').trim());
}

export function parseBukuBesarSheet(sheet) {
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  let headerIdx = -1;
  for (let i = 0; i < Math.min(rawRows.length, 25); i++) {
    const str = (rawRows[i] || []).join(" ").toUpperCase();
    if (str.includes("TANGGAL") && (str.includes("NAMA JENJANG") || str.includes("BIDANG") || str.includes("KP") || str.includes("KK"))) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) headerIdx = 0;
  const rows = rawRows.slice(headerIdx + 1);
  const list = [];

  rows.forEach((row, idx) => {
    if (!row || row.length === 0) return;
    
    // 1. Parsing Tanggal
    let tgl = "";
    const rawTgl = row[0];
    if (typeof rawTgl === "number") {
      const d = XLSX.SSF.parse_date_code(rawTgl);
      tgl = `${String(d.d).padStart(2, "0")}/${String(d.m).padStart(2, "0")}/${d.y}`;
    } else {
      let s = String(rawTgl || "").trim();
      if (s.includes("/")) {
        const p = s.split("/");
        if (p.length === 3) tgl = `${p[0].padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[2].length === 2 ? '20' + p[2] : p[2]}`;
      } else {
        tgl = s;
      }
    }

    // KOLOM B: KODE BIDANG | KOLOM C: NAMA BIDANG
    const kodeBidang = String(row[1] || "").trim();
    const bidang = String(row[2] || "").trim();
    const kodeAkun = String(row[3] || "").trim();
    const namaAkun = String(row[4] || "").trim();
    const uraian = String(row[5] || "").trim();
    const nama = String(row[6] || "").trim();
    const kpFlag = String(row[8] || "").trim();
    const kkFlag = String(row[10] || "").trim();

    let rawDebet = parseIndonesianNumber(row[9]);
    let rawKredit = parseIndonesianNumber(row[11]);

    // Normalisasi Nilai Negatif
    let debet = 0;
    let kredit = 0;

    if (rawKredit < 0) {
      debet = Math.abs(rawKredit);
      kredit = 0;
    } else if (rawDebet < 0) {
      kredit = Math.abs(rawDebet);
      debet = 0;
    } else {
      debet = rawDebet;
      kredit = rawKredit;
    }

    if (!tgl && debet === 0 && kredit === 0) return;
    if (debet === 0 && kredit === 0) return;
    if (uraian.toLowerCase().includes("saldo awal") || uraian.toLowerCase().includes("saldo akhir")) return;

    const isDebitBridge = kpFlag === "2" || (debet > 0 && (
      uraian.toLowerCase().includes("tambahan kas bank") ||
      bidang.toLowerCase().includes("kas bank") ||
      kodeAkun === "111020201" || namaAkun.toUpperCase().includes("BSI") ||
      kodeAkun === "111020202" || namaAkun.toUpperCase().includes("MUAMALAT")
    ) && !uraian.toLowerCase().includes("kas tunai") && !uraian.toLowerCase().includes("pelunasan"));

    const isBankRealizationExpense = kkFlag === "2" || (kredit > 0 && uraian.toLowerCase().startsWith("transfer"));

    list.push({
      id: "KK-" + idx,
      tanggal: tgl,
      kodeBidang: kodeBidang || "01",
      bidang: bidang || "Markaz / Pusat",
      kodeAkun: kodeAkun || "521010110",
      namaAkun: namaAkun || "Beban Operasional Markaz",
      uraian,
      nama,
      kpFlag,
      kkFlag,
      debet,
      kredit,
      kasBank: isDebitBridge || isBankRealizationExpense ? (namaAkun.includes("BSI") || uraian.toLowerCase().includes("bsi") ? "Bank BSI" : "Bank Muamalat") : "Kas Kecil",
      isBridge: isDebitBridge,
      isBankRealizationExpense: isBankRealizationExpense,
      isCompanionBridgeCredit: false,
      isEliminated: false,
      selected: false,
      groupId: null,
      splitGroupId: null,
      isSplitChild: false,
      isSplitParent: false,
      splitCount: 0,
      hidden: false,
      wasCopied: false,
      justCopied: false,
      isGenerated: false,
      isDirectBankOutflow: false,
      originalUraian: uraian
    });
  });

  return list;
}

export function parseBsiCsvText(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const outflows = [];
  const allRows = [];

  lines.forEach((line, idx) => {
    if (idx === 0 && line.toLowerCase().includes("date")) return;
    const clean = parseCsvLine(line);
    if (clean.length < 5) return;

    const dateRaw = clean[0] || "";
    const ket = clean[2] || "";
    const amount = parseIndonesianNumber(clean[4] || "0");
    const isDebit = (clean[5] || "").toUpperCase() === "DB";
    const balance = parseIndonesianNumber(clean[7] || clean[clean.length - 1] || "0");
    const tglClean = formatBankDateString(dateRaw.split(" ")[0]);

    allRows.push({ 
      idx, 
      dateStr: tglClean, 
      saldo: balance, 
      debit: isDebit ? amount : 0, 
      kredit: !isDebit ? amount : 0 
    });

    if (isDebit && amount > 0) {
      const smartCOA = deduceBankExpenseCOA(ket);
      const matchRecipient = ket.match(/(?:TRF Ke -|Bayar .+ Ke -|An |a\.n\. )([A-Z0-9\s]+)/i);

      outflows.push({
        id: "BSI-OUT-" + idx,
        tanggal: tglClean,
        kodeBidang: "01",
        bidang: "Markaz / Pengeluaran BSI",
        kodeAkun: smartCOA.kode,
        namaAkun: smartCOA.nama,
        uraian: ket,
        bankRawDescription: ket,
        nama: matchRecipient ? matchRecipient[1].trim().slice(0, 25) : "-",
        debet: 0,
        kredit: amount,
        kasBank: "Bank BSI",
        matchedBridge: null,
        matchedBridgeText: "",
        dateDiffDays: 0,
        selected: false,
        groupId: null,
        splitGroupId: null,
        isSplitChild: false,
        isSplitParent: false,
        mergeId: null,
        isMergedGroup: false,
        hidden: false,
        wasCopied: false,
        justCopied: false,
        isGenerated: false,
        isDirectBankOutflow: true,
        originalUraian: ket
      });
    }
  });

  return { outflows, allRows };
}

export function parseMuamalatCsvText(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const outflows = [];
  const allRows = [];
  
  let headerLineIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    if (lines[i].includes("Nomor Referensi") || lines[i].includes("Tgl Efektif")) {
      headerLineIdx = i;
      break;
    }
  }
  if (headerLineIdx === -1) headerLineIdx = 8;
  const dataLines = lines.slice(headerLineIdx + 1);

  dataLines.forEach((line, idx) => {
    const parts = parseCsvLine(line);
    if (parts.length < 5) return;

    const tglEfektif = parts[2] || parts[1] || "";
    const debit = parseIndonesianNumber(parts[3] || "0");
    const kredit = parseIndonesianNumber(parts[4] || "0");
    const saldo = parseIndonesianNumber(parts[5] || "0");
    const keterangan = parts[6] || "";
    const tglClean = formatBankDateString(tglEfektif);

    allRows.push({ 
      idx, 
      dateStr: tglClean, 
      saldo: saldo, 
      debit: debit, 
      kredit: kredit 
    });

    if (debit > 0) {
      const smartCOA = deduceBankExpenseCOA(keterangan);
      const matchRecipient = keterangan.match(/(?:TRF Ke -|Bayar .+ Ke -|An |a\.n\. )([A-Z0-9\s]+)/i);

      outflows.push({
        id: "MUA-OUT-" + idx,
        tanggal: tglClean,
        kodeBidang: "01",
        bidang: "Markaz / Pengeluaran Muamalat",
        kodeAkun: smartCOA.kode,
        namaAkun: smartCOA.nama,
        uraian: keterangan,
        bankRawDescription: keterangan,
        nama: matchRecipient ? matchRecipient[1].trim().slice(0, 25) : "-",
        debet: 0,
        kredit: debit,
        kasBank: "Bank Muamalat",
        matchedBridge: null,
        matchedBridgeText: "",
        dateDiffDays: 0,
        selected: false,
        groupId: null,
        splitGroupId: null,
        isSplitChild: false,
        isSplitParent: false,
        mergeId: null,
        isMergedGroup: false,
        hidden: false,
        wasCopied: false,
        justCopied: false,
        isGenerated: false,
        isDirectBankOutflow: true,
        originalUraian: keterangan
      });
    }
  });

  return { outflows, allRows };
}

// Master Pos Unit Usaha yang wajib digabung
const UNIT_USAHA_POS_MAP = [
  { key: "LAUNDRY", label: "Laundry" },
  { key: "HASIL USAHA", label: "Hasil Usaha" },
  { key: "PARKIR", label: "Parkir" },
  { key: "GUEST HOUSE", label: "Guest House" }
];

export function parsePemasukanExcelSheet(sheet) {
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  let headerIdx = -1;
  for (let i = 0; i < Math.min(rawRows.length, 25); i++) {
    const str = (rawRows[i] || []).join(" ").toUpperCase();
    if (str.includes("POS PENERIMAAN") && str.includes("TANGGAL")) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) headerIdx = 0;
  const rows = rawRows.slice(headerIdx + 1);
  const groups = {};

  rows.forEach((row) => {
    if (!row || row.length === 0) return;
    const rawTgl = row[1];
    let dateObj = null;
    if (typeof rawTgl === "number") {
      const utc = new Date(Math.round((rawTgl - 25569) * 86400 * 1000));
      dateObj = new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
    } else {
      const dmy = String(rawTgl || "").trim().match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
      if (dmy) dateObj = new Date(dmy[3], parseInt(dmy[2]) - 1, dmy[1]);
    }
    if (!dateObj) return;

    const penerimaan = parseIndonesianNumber(row[15]);
    if (penerimaan === 0) return;

    const rawMetode = String(row[3] || "").toUpperCase();
    let kasBank = "Kas Besar";
    if (rawMetode.includes("BSI")) kasBank = "BSI";
    else if (rawMetode.includes("MUAMALAT")) kasBank = "Muamalat";
    else if (rawMetode.includes("KECIL")) kasBank = "Kas Kecil";

    const tglFormatted = `${String(dateObj.getDate()).padStart(2, "0")}/${String(dateObj.getMonth() + 1).padStart(2, "0")}/${dateObj.getFullYear()}`;
    const posPenerimaan = String(row[9] || "PENERIMAAN LAIN").trim();
    const targetTapel = String(row[10] || "").trim();
    const ketItem = String(row[14] || row[13] || "").trim();

    const combinedUpper = `${posPenerimaan} ${ketItem}`.toUpperCase();

    // -------------------------------------------------------------
    // CEK APAKAH TERMASUK KELOMPOK POS UNIT USAHA YANG DIGABUNG
    // -------------------------------------------------------------
    const matchedUnit = UNIT_USAHA_POS_MAP.find(u => combinedUpper.includes(u.key));

    if (matchedUnit) {
      // Grouping khusus Unit Usaha per Tgl + per Kas/Bank
      const key = `${tglFormatted}___${kasBank}___BUNDLE_UNIT_USAHA`;
      const coaUnitUsaha = "213010199 - Utang Jangka Pendek Lainnya";

      if (!groups[key]) {
        groups[key] = {
          id: "INC-UU-" + key,
          dateObj,
          tglFormatted,
          kasBank,
          posPenerimaan: "UNIT USAHA",
          targetTapel: "",
          kategori: "TAPEL SEKARANG",
          coaBaru: coaUnitUsaha,
          isUnitUsahaBundle: true,
          jmlTrans: 0,
          totalPenerimaan: 0,
          activeUnits: new Set()
        };
      }

      groups[key].jmlTrans++;
      groups[key].totalPenerimaan += penerimaan;
      groups[key].activeUnits.add(matchedUnit.label);
      return;
    }

    // -------------------------------------------------------------
    // PROSES TRANSAKSI NON-UNIT USAHA (NORMAL)
    // -------------------------------------------------------------
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth() + 1;
    const transTapel = m >= 7 ? `${y}/${y + 1}` : `${y - 1}/${y}`;

    let kategori = "TAPEL SEKARANG";
    if (transTapel && targetTapel) {
      const tY = parseInt(transTapel.split("/")[0]);
      const tarY = parseInt(targetTapel.split("/")[0]);
      if (!isNaN(tY) && !isNaN(tarY)) {
        if (tarY > tY) kategori = "TAPEL AKAN DATANG";
        else if (tarY < tY) kategori = "TAPEL LALU";
      }
    }

    const coaBaru = determineCOA(posPenerimaan, ketItem, kategori);
    const key = `${tglFormatted}___${kasBank}___${posPenerimaan}___${targetTapel}___${coaBaru}`;

    if (!groups[key]) {
      groups[key] = {
        id: "INC-" + key,
        dateObj,
        tglFormatted,
        kasBank,
        posPenerimaan,
        targetTapel,
        kategori,
        coaBaru,
        isUnitUsahaBundle: false,
        jmlTrans: 0,
        totalPenerimaan: 0,
        keteranganSet: new Set()
      };
    }

    groups[key].jmlTrans++;
    groups[key].totalPenerimaan += penerimaan;
    if (ketItem && ketItem !== "-") groups[key].keteranganSet.add(ketItem);
  });

  return Object.values(groups).map(g => {
    let uraianFinal = "";

    if (g.isUnitUsahaBundle) {
      // Format Dinamis: Penerimaan Unit Usaha [Kas/Bank] (Laundry, Parkir)
      const listActive = Array.from(g.activeUnits).join(", ");
      uraianFinal = `Penerimaan Unit Usaha via ${g.kasBank} (${listActive})`;
    } else {
      let detailStr = Array.from(g.keteranganSet).slice(0, 2).join(", ");
      uraianFinal = `Penerimaan ${g.posPenerimaan}`;
      if (g.targetTapel) uraianFinal += ` T.A ${g.targetTapel}`;
      if (detailStr) uraianFinal += ` (${detailStr})`;
    }

    return {
      id: g.id,
      dateObj: g.dateObj,
      tglFormatted: g.tglFormatted,
      kasBank: g.kasBank,
      posPenerimaan: g.posPenerimaan,
      targetTapel: g.targetTapel,
      kategori: g.kategori,
      coaBaru: g.coaBaru,
      jmlTrans: g.jmlTrans,
      totalPenerimaan: g.totalPenerimaan,
      uraianJurnal: uraianFinal,
      wasCopied: false,
      justCopied: false
    };
  }).sort((a, b) => a.dateObj - b.dateObj);
}