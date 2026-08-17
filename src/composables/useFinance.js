/**
 * ======================================================================
 * FILE: src/composables/useFinance.js
 * STATE CONTROLLER & RECONCILIATION ENGINE (100% DOUBLE ENTRY STANDARDIZED)
 * ======================================================================
 */

import { ref, reactive, computed } from "vue";
import * as XLSX from "xlsx";
import { parseBukuBesarSheet, parseBsiCsvText, parseMuamalatCsvText, parsePemasukanExcelSheet } from "../utils/parsers.js";
import { 
  parseSortableTimestamp, 
  formatRupiah, 
  standardizeExpenseDescription,
  getCategoryBadge
} from "../utils/formatters.js";
import { MASTER_COA_LIST } from "../constants/coa.js";
import { exportPengeluaranToExcel, exportPemasukanToExcel } from "../utils/exportExcel.js";

// Global Shared State
const activeTab = ref("pengeluaran");
const isLoading = ref(false);
const loadingMessage = ref("Memproses...");

const showLPJModal = ref(false);
const showBankDetailModal = ref(false);
const showMergeModal = ref(false);
const selectedBankDetailItem = ref(null);
const selectedBankBalanceDate = ref("LATEST");
const coaSearchQuery = ref("");

// State Modal Edit Universal
const showEditModal = ref(false);
const editForm = reactive({
  id: null,
  type: "pengeluaran",
  uraian: "",
  selectedKode: "",
  selectedNama: "",
  rawItemRef: null
});

const filesStatus = reactive({ bukuBesar: false, bsi: false, muamalat: false, pemasukan: false });
const rawKasKecilExpenses = ref([]);
const rawBsiOutflows = ref([]);
const rawBsiAllRows = ref([]);
const rawMuamalatOutflows = ref([]);
const rawMuamalatAllRows = ref([]);
const eliminatedBridges = ref([]);

const pengeluaranData = ref([]);
const pemasukanData = ref([]);

const mergeCounter = ref(0);
const mergeForm = reactive({ tanggal: "", uraian: "", coa: "621010101 - Beban Administrasi Bank", kasBank: "", totalNominal: 0, itemCount: 0 });

const lpjCounter = ref(0);
const lpjUraian = ref("");
const lpjSummary = reactive({ totalKasbon: 0, totalBeban: 0, selisih: 0, status: "", isReimburse: false });

// Filter Pengeluaran (Ditambahkan Filter Label/Kategori) & Pemasukan
const filterPengeluaran = reactive({ 
  date: "ALL", 
  kasBank: "ALL", 
  sourceType: "ALL", 
  penerima: "ALL",
  kategori: "ALL", // <-- FILTER LABEL / KATEGORI
  search: "" 
});
const filterPemasukan = reactive({ date: "ALL", bank: "ALL", search: "" });
const toast = reactive({ show: false, message: "", timeout: null });

// State Expand/Collapse Baris LPJ di Tabel UI
const expandedLPJGroups = ref(new Set());
const toggleExpandLPJ = (groupId) => {
  if (expandedLPJGroups.value.has(groupId)) {
    expandedLPJGroups.value.delete(groupId);
  } else {
    expandedLPJGroups.value.add(groupId);
  }
};

export function useFinance() {
  const showToast = (msg) => {
    if (toast.timeout) clearTimeout(toast.timeout);
    toast.message = msg;
    toast.show = true;
    toast.timeout = setTimeout(() => toast.show = false, 2500);
  };

  const copyNominal = (amt) => {
    if (!amt) return;
    const clean = Math.abs(amt);
    navigator.clipboard.writeText(String(clean)).then(() => {
      showToast(`Nominal ${formatRupiah(clean)} disalin!`);
    });
  };

  // =========================================================================
  // FITUR EDIT UNIVERSAL (PENGELUARAN & PEMASUKAN)
  // =========================================================================
  const openEditModal = (item, type = "pengeluaran") => {
    editForm.id = item.id;
    editForm.type = type;
    editForm.rawItemRef = item;

    if (type === "pengeluaran") {
      editForm.uraian = item.uraian;
      editForm.selectedKode = item.kodeAkun || "521010110";
      editForm.selectedNama = item.namaAkun || "Beban Operasional Markaz";
    } else {
      editForm.uraian = item.uraianJurnal;
      const parts = String(item.coaBaru || "").split(" - ");
      editForm.selectedKode = parts[0] ? parts[0].trim() : "423010105";
      editForm.selectedNama = parts[1] ? parts[1].trim() : item.coaBaru;
    }

    showEditModal.value = true;
  };

  const confirmSaveEdit = () => {
    if (!editForm.rawItemRef) return;
    const item = editForm.rawItemRef;

    if (editForm.type === "pengeluaran") {
      item.uraian = editForm.uraian.trim();
      item.kodeAkun = editForm.selectedKode;
      item.namaAkun = editForm.selectedNama;
    } else {
      item.uraianJurnal = editForm.uraian.trim();
      item.coaBaru = `${editForm.selectedKode} - ${editForm.selectedNama}`;
    }

    showEditModal.value = false;
    showToast("Perubahan COA & Deskripsi berhasil disimpan!");
  };

  // =========================================================================
  // RECONCILIATION ENGINE
  // =========================================================================
  const runReconciliation = () => {
    const elimBridges = [];
    const rawKas = rawKasKecilExpenses.value;

    rawKas.forEach(k => {
      k.isEliminated = false;
      k.isCompanionBridgeCredit = false;
    });

    const cleanWords = (str) => {
      return (str || "").toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !['tambahan', 'kas', 'bank', 'untuk', 'transfer', 'bayar', 'trf', 'dari', 'bifast', 'dan', 'pit', 'an', 'belanja', 'ke'].includes(w));
    };

    const extractNames = (str) => {
      return (str || "").toUpperCase()
        .replace(/[^A-Z\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !['BANK', 'BCA', 'BRI', 'BNI', 'BSI', 'MANDIRI', 'MUAMALAT', 'BAYAR', 'TRANSFER', 'TRF', 'DANA', 'PINJAMAN', 'TITIP', 'DARI', 'UNTUK'].includes(w));
    };

    const allBank = [...rawBsiOutflows.value, ...rawMuamalatOutflows.value];
    const generatedBankSplitRows = [];

    // PASS 1: SCORE-BASED MATCHING
    const candidatePairs = [];

    allBank.forEach(bItem => {
      const bNom = bItem.kredit;
      const bTime = parseSortableTimestamp(bItem.tanggal);
      const bWords = cleanWords(bItem.bankRawDescription);
      const bNames = extractNames(bItem.nama + " " + bItem.bankRawDescription);

      rawKas.filter(k => !k.isBridge && Math.abs(k.kredit) === bNom).forEach(kkCredit => {
        const kkTime = parseSortableTimestamp(kkCredit.tanggal);
        const diffDays = Math.round(Math.abs(kkTime - bTime) / 86400000);

        if (diffDays <= 10) {
          let score = 0;
          const kkWords = cleanWords(kkCredit.uraian + " " + kkCredit.nama);
          const kkNames = extractNames(kkCredit.nama + " " + kkCredit.uraian);

          const hasNameMatch = bNames.some(bn => kkNames.includes(bn));
          const hasNameConflict = bNames.length > 0 && kkNames.length > 0 && !hasNameMatch;

          if (hasNameMatch) score += 50;
          else if (hasNameConflict && diffDays > 0) score -= 40;

          const hasWordMatch = bWords.some(bw => kkWords.includes(bw));
          if (hasWordMatch) score += 30;

          if (diffDays === 0) score += 20;
          else if (diffDays === 1) score += 15;
          else if (diffDays <= 3) score += 10;
          else score += 5;

          if (kkCredit.kkFlag === "2" || kkCredit.isBankRealizationExpense) score += 10;

          candidatePairs.push({ bItem, kkCredit, diffDays, score });
        }
      });
    });

    candidatePairs.sort((a, b) => b.score - a.score);

    const matchedBankIds = new Set();
    const matchedKasirIds = new Set();

    candidatePairs.forEach(pair => {
      if (pair.score < 25) return;
      if (matchedBankIds.has(pair.bItem.id) || matchedKasirIds.has(pair.kkCredit.id)) return;

      const { bItem, kkCredit, diffDays } = pair;

      const matchedDebitBridge = rawKas.find(k => 
        !k.isEliminated && 
        (k.kpFlag === "2" || k.isBridge) && 
        Math.abs(k.debet) === bItem.kredit &&
        Math.round(Math.abs(parseSortableTimestamp(k.tanggal) - parseSortableTimestamp(bItem.tanggal)) / 86400000) <= 10
      );

      bItem.matchedBridge = kkCredit.id;
      bItem.dateDiffDays = diffDays;
      bItem.matchedBridgeText = `[Kasir KK=2] ${kkCredit.uraian}`;
      bItem.uraian = standardizeExpenseDescription(kkCredit.uraian, kkCredit.nama, kkCredit.kodeAkun, bItem.kasBank);
      bItem.kodeAkun = kkCredit.kodeAkun;
      bItem.namaAkun = kkCredit.namaAkun;
      if (kkCredit.nama && kkCredit.nama !== "-") {
        bItem.nama = kkCredit.nama;
      }

      kkCredit.isEliminated = true;
      kkCredit.isCompanionBridgeCredit = true;
      matchedBankIds.add(bItem.id);
      matchedKasirIds.add(kkCredit.id);

      if (matchedDebitBridge) {
        matchedDebitBridge.isEliminated = true;
        matchedDebitBridge.isBridge = true;
      }

      elimBridges.push({
        id: "AUDIT-" + bItem.id,
        debitBridgeUraian: matchedDebitBridge ? matchedDebitBridge.uraian : "(KP=2 tidak terpisah)",
        debitBridgeTanggal: matchedDebitBridge ? matchedDebitBridge.tanggal : "-",
        creditExpenseUraian: kkCredit.uraian,
        creditExpenseTanggal: kkCredit.tanggal,
        creditExpenseCOA: `${kkCredit.kodeAkun} - ${kkCredit.namaAkun}`,
        creditExpenseNama: kkCredit.nama || "-",
        nominal: bItem.kredit,
        bankUraian: bItem.bankRawDescription,
        bankTanggal: bItem.tanggal,
        kasBank: bItem.kasBank,
        dateDiffDays: diffDays
      });
    });

    // PASS 2: 1-TO-N SPLIT MATCHING
    const unmatchedBankOutflows = allBank.filter(b => !matchedBankIds.has(b.id));

    unmatchedBankOutflows.forEach(bItem => {
      const bNom = bItem.kredit;
      const bTime = parseSortableTimestamp(bItem.tanggal);

      const nearbyUnmatchedCredits = rawKas.filter(k => {
        if (k.isEliminated) return false;
        if (k.kkFlag !== "2" && !k.isBankRealizationExpense) return false;
        const diff = Math.round(Math.abs(parseSortableTimestamp(k.tanggal) - bTime) / 86400000);
        return diff <= 10;
      });

      let matchedCluster = null;
      const dateGroups = {};
      nearbyUnmatchedCredits.forEach(item => {
        if (!dateGroups[item.tanggal]) dateGroups[item.tanggal] = [];
        dateGroups[item.tanggal].push(item);
      });

      for (let tgl in dateGroups) {
        const group = dateGroups[tgl];
        const sum = group.reduce((acc, curr) => acc + curr.kredit, 0);
        if (Math.abs(sum - bNom) < 1) {
          matchedCluster = group;
          break;
        }
      }

      if (!matchedCluster && nearbyUnmatchedCredits.length <= 15) {
        const findSubset = (arr, target) => {
          let result = null;
          const search = (index, currentSum, currentArr) => {
            if (result) return;
            if (Math.abs(currentSum - target) < 1 && currentArr.length > 1) {
              result = [...currentArr];
              return;
            }
            if (currentSum > target || index >= arr.length) return;
            for (let i = index; i < arr.length; i++) {
              search(i + 1, currentSum + arr[i].kredit, [...currentArr, arr[i]]);
            }
          };
          search(0, 0, []);
          return result;
        };
        matchedCluster = findSubset(nearbyUnmatchedCredits, bNom);
      }

      if (matchedCluster && matchedCluster.length > 1) {
        bItem.matchedBridge = "SPLIT-" + bItem.id;
        bItem.hidden = true;
        matchedBankIds.add(bItem.id);

        matchedCluster.forEach((cItem, cIdx) => {
          cItem.isEliminated = true;
          cItem.isCompanionBridgeCredit = true;

          // Double Entry: Beban selalu di DEBET
          generatedBankSplitRows.push({
            id: `SPLIT-${bItem.id}-${cIdx}`,
            tanggal: bItem.tanggal,
            kasBank: bItem.kasBank,
            bidang: cItem.bidang,
            kodeAkun: cItem.kodeAkun,
            namaAkun: cItem.namaAkun,
            uraian: standardizeExpenseDescription(cItem.uraian, cItem.nama, cItem.kodeAkun, bItem.kasBank),
            bankRawDescription: bItem.bankRawDescription,
            nama: cItem.nama || bItem.nama,
            debet: Math.abs(cItem.kredit || cItem.debet),
            kredit: 0,
            matchedBridge: bItem.id,
            dateDiffDays: Math.round(Math.abs(parseSortableTimestamp(cItem.tanggal) - bTime) / 86400000),
            selected: false,
            groupId: null,
            mergeId: null,
            isMergedGroup: false,
            hidden: false,
            wasCopied: false,
            justCopied: false,
            isGenerated: false,
            isDirectBankOutflow: true,
            originalUraian: cItem.uraian
          });
        });

        const matchingDebitBridge = rawKas.find(k => !k.isEliminated && (k.kpFlag === "2" || k.isBridge) && Math.abs(k.debet - bNom) < 1);
        if (matchingDebitBridge) {
          matchingDebitBridge.isEliminated = true;
          matchingDebitBridge.isBridge = true;
        }

        elimBridges.push({
          id: "AUDIT-SPLIT-" + bItem.id,
          debitBridgeUraian: matchingDebitBridge ? matchingDebitBridge.uraian : `(Total Jembatan ${matchedCluster.length} Baris)`,
          debitBridgeTanggal: matchingDebitBridge ? matchingDebitBridge.tanggal : "-",
          creditExpenseUraian: `[1 Bank di-Split ke ${matchedCluster.length} Item] ${matchedCluster.map(x => x.uraian).slice(0, 2).join(", ")}...`,
          creditExpenseTanggal: matchedCluster[0].tanggal,
          creditExpenseCOA: "Multi-COA Sesuai Kasir",
          creditExpenseNama: matchedCluster[0].nama || "-",
          nominal: bNom,
          bankUraian: bItem.bankRawDescription,
          bankTanggal: bItem.tanggal,
          kasBank: bItem.kasBank,
          dateDiffDays: Math.round(Math.abs(parseSortableTimestamp(matchedCluster[0].tanggal) - bTime) / 86400000)
        });
      }
    });

    // =========================================================================
    // PASS 3: STANDARISASI DOUBLE ENTRY UNTUK SEMUA DATA
    // =========================================================================
   const activeKasKecilTunai = rawKas.filter(k => 
      !k.isEliminated && 
      !k.isBridge && 
      !k.isCompanionBridgeCredit && 
      k.kkFlag !== "2" && 
      k.kpFlag !== "2" &&
      (k.debet > 0 || k.kredit > 0)
    ).map(k => {
      const rawLower = (String(k.originalUraian || "") + " " + String(k.uraian || "")).toLowerCase();
      const isKasbonCOA = String(k.kodeAkun).startsWith("113");
      
      // HANYA yang keterangannya pelunasan/tutup yang masuk KREDIT
      const isKasbonClose = isKasbonCOA && (
        rawLower.includes("pelunasan") || 
        rawLower.includes("tutup") || 
        rawLower.includes("selesai")
      );
      
      const rawNom = Math.abs(k.debet !== 0 ? k.debet : k.kredit);
      
      return {
        ...k,
        // Kasbon Baru & Beban = DEBET | Pelunasan Kasbon Saja = KREDIT
        debet: isKasbonClose ? 0 : rawNom,
        kredit: isKasbonClose ? rawNom : 0,
        uraian: standardizeExpenseDescription(k.uraian, k.nama, k.kodeAkun, k.kasBank)
      };
    });

    const unmatchedKasirExpenses = rawKas.filter(k => 
      !k.isEliminated && 
      !k.isBridge && 
      (k.kkFlag === "2" || k.isBankRealizationExpense) &&
      (k.debet > 0 || k.kredit > 0)
    ).map(k => {
      const rawNom = Math.abs(k.debet !== 0 ? k.debet : k.kredit);
      return {
        ...k,
        debet: rawNom,
        kredit: 0,
        uraian: `⚠️ [Belum Match Bank] ${standardizeExpenseDescription(k.uraian, k.nama, k.kodeAkun, k.kasBank)}`
      };
    });

    // Bank Outflow: Semua pengeluaran beban bank berada di DEBET
    const normalizedBankOutflows = allBank.filter(b => !b.mergeId && !b.hidden).map(b => {
      const nom = Math.abs(b.kredit !== 0 ? b.kredit : b.debet);
      return {
        ...b,
        debet: nom,
        kredit: 0,
        uraian: b.matchedBridge ? b.uraian : standardizeExpenseDescription(b.uraian, b.nama, b.kodeAkun, b.kasBank)
      };
    });

    const combined = [
      ...activeKasKecilTunai,
      ...unmatchedKasirExpenses,
      ...generatedBankSplitRows,
      ...normalizedBankOutflows
    ];

    pengeluaranData.value = combined.sort((a, b) => parseSortableTimestamp(a.tanggal) - parseSortableTimestamp(b.tanggal));
    eliminatedBridges.value = elimBridges;
  };

  // Upload Handlers
  const uploadBukuBesar = async (file) => {
    isLoading.value = true;
    loadingMessage.value = "Membaca Buku Besar...";
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames.find(s => s.toLowerCase().includes("buku besar"))] || wb.Sheets[wb.SheetNames[0]];
      rawKasKecilExpenses.value = parseBukuBesarSheet(sheet);
      filesStatus.bukuBesar = true;
      runReconciliation();
      showToast("Buku Besar berhasil dipasang!");
    } catch (err) {
      alert("Gagal membaca Buku Besar: " + err.message);
    } finally {
      isLoading.value = false;
    }
  };

  const uploadBsiCsv = async (file) => {
    isLoading.value = true;
    loadingMessage.value = "Membaca CSV Bank BSI...";
    try {
      const text = await file.text();
      const parsed = parseBsiCsvText(text);
      rawBsiOutflows.value = parsed.outflows;
      rawBsiAllRows.value = parsed.allRows;
      filesStatus.bsi = true;
      runReconciliation();
      showToast("CSV BSI berhasil dipasang!");
    } catch (err) {
      alert("Gagal membaca CSV BSI: " + err.message);
    } finally {
      isLoading.value = false;
    }
  };

  const uploadMuamalatCsv = async (file) => {
    isLoading.value = true;
    loadingMessage.value = "Membaca CSV Bank Muamalat...";
    try {
      const text = await file.text();
      const parsed = parseMuamalatCsvText(text);
      rawMuamalatOutflows.value = parsed.outflows;
      rawMuamalatAllRows.value = parsed.allRows;
      filesStatus.muamalat = true;
      runReconciliation();
      showToast("CSV Muamalat berhasil dipasang!");
    } catch (err) {
      alert("Gagal membaca CSV Muamalat: " + err.message);
    } finally {
      isLoading.value = false;
    }
  };

  const uploadPemasukanExcel = async (file) => {
    isLoading.value = true;
    loadingMessage.value = "Membaca Excel Pemasukan Siswa...";
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });
      pemasukanData.value = parsePemasukanExcelSheet(wb.Sheets[wb.SheetNames[0]]);
      filesStatus.pemasukan = true;
      showToast("Pemasukan siswa berhasil dipetakan!");
    } catch (err) {
      alert("Gagal membaca Excel Pemasukan: " + err.message);
    } finally {
      isLoading.value = false;
    }
  };

  // Merge Actions
  const openMergeModal = () => {
    const selected = pengeluaranData.value.filter(i => i.selected && !i.groupId && !i.isMergedGroup);
    if (selected.length < 2) return;
    let total = 0;
    selected.forEach(item => { total += Math.abs(item.debet !== 0 ? item.debet : item.kredit); });
    const lastItem = selected[selected.length - 1];

    mergeForm.tanggal = lastItem.tanggal;
    mergeForm.uraian = `Biaya Administrasi Bank ${lastItem.kasBank.replace(/Bank /gi, '')} (${selected.length} Transaksi e-Banking)`;
    mergeForm.coa = "621010101 - Beban Administrasi Bank";
    mergeForm.kasBank = lastItem.kasBank;
    mergeForm.totalNominal = total;
    mergeForm.itemCount = selected.length;
    showMergeModal.value = true;
  };

  const confirmMergeGroup = () => {
    mergeCounter.value++;
    const newMergeId = "MRG-" + String(mergeCounter.value).padStart(3, '0');
    const selected = pengeluaranData.value.filter(i => i.selected && !i.groupId && !i.isMergedGroup);
    if (selected.length === 0) return;

    const parts = mergeForm.coa.split(" - ");
    const kodeAkun = parts[0] ? parts[0].trim() : "621010101";
    const namaAkun = parts[1] ? parts[1].trim() : mergeForm.coa;

    let lastIdx = -1;
    pengeluaranData.value.forEach((item, idx) => {
      if (item.selected && !item.groupId && !item.isMergedGroup) lastIdx = idx;
    });

    selected.forEach(item => {
      item.mergeId = newMergeId;
      item.isMergedChild = true;
      item.hidden = true;
      item.selected = false;
    });

    const mergedRow = {
      id: "MERGED-" + Date.now(),
      tanggal: mergeForm.tanggal,
      kasBank: mergeForm.kasBank,
      bidang: "Pengeluaran Konsolidasi Bank",
      kodeAkun: kodeAkun,
      namaAkun: namaAkun,
      uraian: mergeForm.uraian,
      bankRawDescription: `Konsolidasi ${selected.length} mutasi bank`,
      nama: "Bank",
      debet: mergeForm.totalNominal,
      kredit: 0,
      selected: false,
      groupId: null,
      mergeId: newMergeId,
      isMergedGroup: true,
      isMergedChild: false,
      mergedCount: selected.length,
      hidden: false,
      wasCopied: false,
      justCopied: false,
      isGenerated: false,
      isDirectBankOutflow: true,
      originalUraian: mergeForm.uraian
    };

    if (lastIdx !== -1) pengeluaranData.value.splice(lastIdx + 1, 0, mergedRow);
    else pengeluaranData.value.push(mergedRow);

    showMergeModal.value = false;
    showToast(`Berhasil menggabungkan ${selected.length} transaksi!`);
  };

  const unmergeGroup = (mergeId) => {
    pengeluaranData.value = pengeluaranData.value.filter(i => !(i.isMergedGroup && i.mergeId === mergeId));
    pengeluaranData.value.forEach(item => {
      if (item.mergeId === mergeId) {
        item.mergeId = null;
        item.isMergedChild = false;
        item.hidden = false;
      }
    });
    showToast("Transaksi gabungan telah dipisahkan kembali.");
  };

  // LPJ Kasbon Actions
  const calculateLPJGroup = () => {
    const selected = pengeluaranData.value.filter(i => i.selected && !i.groupId);
    let totalKasbon = 0, totalBeban = 0;

    selected.forEach(item => {
      const isKasbon = String(item.kodeAkun).startsWith("113");
      const rawNom = Math.abs(item.debet !== 0 ? item.debet : item.kredit);
      if (isKasbon) totalKasbon += rawNom;
      else totalBeban += rawNom;
    });

    const selisih = totalKasbon - totalBeban;
    const isReimburse = selisih < 0;

    lpjSummary.totalKasbon = totalKasbon;
    lpjSummary.totalBeban = totalBeban;
    lpjSummary.selisih = Math.abs(selisih);
    lpjSummary.status = isReimburse ? "Kekurangan Dana / Reimburse" : "Sisa Lebih / Pengembalian Fisik Kasbon";
    lpjSummary.isReimburse = isReimburse;
    lpjUraian.value = selected.length > 0 ? selected[0].uraian : "Penyelesaian Kasbon";
    showLPJModal.value = true;
  };

  const confirmLPJGroup = () => {
    lpjCounter.value++;
    const newGroupId = "LPJ-" + String(lpjCounter.value).padStart(3, '0');
    const targetUraian = lpjUraian.value.trim() || "Penyelesaian Kasbon";
    const selected = pengeluaranData.value.filter(i => i.selected && !i.groupId);
    if (selected.length === 0) return;

    const first = selected[0];
    let totalKasbon = 0, totalBeban = 0;

    selected.forEach(item => {
      const isKasbon = String(item.kodeAkun).startsWith("113");
      const rawNom = Math.abs(item.debet !== 0 ? item.debet : item.kredit);
      if (isKasbon) totalKasbon += rawNom;
      else totalBeban += rawNom;
    });

    const selisih = totalKasbon - totalBeban;

    pengeluaranData.value.forEach(item => {
      if (item.selected && !item.groupId) {
        const isKasbon = String(item.kodeAkun).startsWith("113");
        const rawNom = Math.abs(item.debet !== 0 ? item.debet : item.kredit);

        item.groupId = newGroupId;
        item.uraian = targetUraian;
        item.selected = false;

        if (isKasbon) {
          item.debet = 0;
          item.kredit = rawNom;
        } else {
          item.debet = rawNom;
          item.kredit = 0;
        }
      }
    });

    let lastIdx = -1;
    pengeluaranData.value.forEach((item, idx) => {
      if (item.groupId === newGroupId) lastIdx = idx;
    });

    if (Math.abs(selisih) > 0.01 && lastIdx !== -1) {
      const isReimburse = selisih < 0;
      const absSelisih = Math.abs(selisih);
      
      let bankCode = "111010201", bankName = "Kas Kecil Mahad Ibnu Taimiyah";
      if (first.kasBank === "Bank BSI") { bankCode = "111020201"; bankName = "BSI"; }
      else if (first.kasBank === "Bank Muamalat") { bankCode = "111020202"; bankName = "Muamalat"; }
      else if (first.kasBank === "Kas Besar") { bankCode = "111010202"; bankName = "Kas Besar Mahad Ibnu Taimiyah"; }

      const generatedRow = {
        id: "GEN-" + Date.now(),
        tanggal: first.tanggal,
        kasBank: first.kasBank,
        bidang: "KAS / BANK BALANCING",
        kodeAkun: bankCode,
        namaAkun: bankName,
        uraian: isReimburse ? `[Reimburse Selisih] ${targetUraian}` : `[Pengembalian Sisa Kasbon] ${targetUraian}`,
        nama: first.nama,
        debet: isReimburse ? 0 : absSelisih,
        kredit: isReimburse ? absSelisih : 0,
        selected: false,
        groupId: newGroupId,
        hidden: false,
        wasCopied: false,
        justCopied: false,
        isGenerated: true,
        isDirectBankOutflow: false,
        originalUraian: targetUraian
      };

      pengeluaranData.value.splice(lastIdx + 1, 0, generatedRow);
    }

    showLPJModal.value = false;
    showToast(`Berhasil mengikat ${newGroupId} (Jurnal Seimbang/Balance)`);
  };

  const ungroupLPJ = (gId) => {
    pengeluaranData.value = pengeluaranData.value.filter(i => !(i.groupId === gId && i.isGenerated));
    pengeluaranData.value.forEach(item => {
      if (item.groupId === gId) {
        item.groupId = null;
        item.uraian = item.originalUraian || item.uraian;
      }
    });
    showToast(`Ikatan ${gId} dilepas.`);
  };

  const hidePengeluaranRow = (item) => {
    item.hidden = true;
    showToast("Baris disembunyikan.");
  };

  const restoreHiddenPengeluaran = () => {
    pengeluaranData.value.forEach(i => { if (!i.isMergedChild) i.hidden = false; });
    showToast("Semua baris tersembunyi dipulihkan.");
  };

  // =========================================================================
  // PAYLOAD GENERATOR
  // =========================================================================
  const handlePengeluaranRowAction = (item) => {
    const isDebetEntry = item.debet > 0;
    const amt = isDebetEntry ? item.debet : item.kredit;
    
    const posCOA = isDebetEntry ? "DEBIT" : "KREDIT";
    const posBank = isDebetEntry ? "KREDIT" : "DEBIT";

    const payload = [
      `${item.tanggal}|${item.uraian}`,
      `${item.kasBank}|${posBank}|${amt}`,
      `${item.kodeAkun} - ${item.namaAkun}|${posCOA}|${amt}`
    ].join("\n");

    navigator.clipboard.writeText(payload).then(() => {
      item.wasCopied = true;
      item.justCopied = true;
      setTimeout(() => item.justCopied = false, 1500);
      showToast("Payload Pengeluaran disalin!");
    });
  };

  const handleCopyLPJBundle = (groupId) => {
    const groupItems = pengeluaranData.value.filter(i => i.groupId === groupId && !i.hidden);
    if (groupItems.length === 0) return;

    const first = groupItems[0];
    const lines = [`${first.tanggal}|${first.uraian}`];

    groupItems.forEach(item => {
      const pos = item.debet > 0 ? "DEBIT" : "KREDIT";
      const amt = item.debet > 0 ? item.debet : item.kredit;
      const coaLabel = item.isGenerated ? item.kasBank : `${item.kodeAkun} - ${item.namaAkun}`;
      
      lines.push(`${coaLabel}|${pos}|${amt}`);
    });

    const fullPayload = lines.join("\n");
    navigator.clipboard.writeText(fullPayload).then(() => {
      groupItems.forEach(i => {
        i.wasCopied = true;
        i.justCopied = true;
        setTimeout(() => i.justCopied = false, 1500);
      });
      showToast(`Bundle LPJ (${groupItems.length} Baris) disalin!`);
    });
  };

  const handlePemasukanRowAction = (item) => {
    const nom = Math.abs(item.totalPenerimaan);
    const tgl = (item.tglFormatted || "").replace(/-/g, '/');

    const payload = [
      `${tgl}|${item.uraianJurnal}`,
      `${item.kasBank}|DEBIT|${nom}`,
      `${item.coaBaru}|KREDIT|${nom}`
    ].join("\n");

    navigator.clipboard.writeText(payload).then(() => {
      item.wasCopied = true;
      item.justCopied = true;
      setTimeout(() => item.justCopied = false, 1500);
      showToast("Payload Pemasukan disalin!");
    });
  };

  const resetAll = () => {
    rawKasKecilExpenses.value = [];
    rawBsiOutflows.value = [];
    rawBsiAllRows.value = [];
    rawMuamalatOutflows.value = [];
    rawMuamalatAllRows.value = [];
    eliminatedBridges.value = [];
    pengeluaranData.value = [];
    pemasukanData.value = [];
    Object.keys(filesStatus).forEach(k => filesStatus[k] = false);
    lpjCounter.value = 0;
    mergeCounter.value = 0;
    showToast("Semua data berhasil direset.");
  };

  // =========================================================================
  // COMPUTED PROPERTIES
  // =========================================================================
  const uploadedFilesCount = computed(() => {
    return (filesStatus.bukuBesar ? 1 : 0) + (filesStatus.bsi ? 1 : 0) + (filesStatus.muamalat ? 1 : 0) + (filesStatus.pemasukan ? 1 : 0);
  });

  const selectedCountPengeluaran = computed(() => {
    return pengeluaranData.value.filter(i => i.selected && !i.groupId && !i.hidden).length;
  });

  const hiddenPengeluaranCount = computed(() => {
    return pengeluaranData.value.filter(i => i.hidden && !i.isMergedChild).length;
  });

  const allBankAvailableDates = computed(() => {
    const set = new Set();
    rawBsiAllRows.value.forEach(r => { if (r.dateStr) set.add(r.dateStr); });
    rawMuamalatAllRows.value.forEach(r => { if (r.dateStr) set.add(r.dateStr); });
    return Array.from(set).sort((a, b) => parseSortableTimestamp(a) - parseSortableTimestamp(b));
  });

  const computedBankBalances = computed(() => {
    let bsiBal = 0, bsiDate = "", muaBal = 0, muaDate = "";
    const date = selectedBankBalanceDate.value;

    if (date === "LATEST") {
      if (rawBsiAllRows.value.length) {
        const last = rawBsiAllRows.value[rawBsiAllRows.value.length - 1];
        bsiBal = last.saldo; bsiDate = last.dateStr;
      }
      if (rawMuamalatAllRows.value.length) {
        const last = rawMuamalatAllRows.value[rawMuamalatAllRows.value.length - 1];
        muaBal = last.saldo; muaDate = last.dateStr;
      }
    } else {
      const targetTime = parseSortableTimestamp(date);
      for (let i = rawBsiAllRows.value.length - 1; i >= 0; i--) {
        const r = rawBsiAllRows.value[i];
        if (parseSortableTimestamp(r.dateStr) <= targetTime && r.saldo > 0) { bsiBal = r.saldo; bsiDate = r.dateStr; break; }
      }
      for (let i = rawMuamalatAllRows.value.length - 1; i >= 0; i--) {
        const r = rawMuamalatAllRows.value[i];
        if (parseSortableTimestamp(r.dateStr) <= targetTime && r.saldo > 0) { muaBal = r.saldo; muaDate = r.dateStr; break; }
      }
    }
    return { bsi: bsiBal, bsiDate, muamalat: muaBal, muamalatDate: muaDate };
  });

  const availablePenerimaPengeluaran = computed(() => {
    const set = new Set();
    pengeluaranData.value.forEach(i => {
      if (i.nama && i.nama !== "-" && i.nama.trim() !== "") {
        set.add(i.nama.trim());
      }
    });
    return Array.from(set).sort();
  });

  // DAFTAR LABEL KATEGORI YANG TERSEDIA SECARA DINAMIS
  const availableCategoriesPengeluaran = computed(() => {
    const set = new Set();
    pengeluaranData.value.forEach(item => {
      const b = getCategoryBadge(item);
      if (b && b.label) set.add(b.label);
    });
    return Array.from(set);
  });

  // FILTERED PENGELUARAN DENGAN FILTER KATEGORI/LABEL
  const filteredPengeluaran = computed(() => {
    return pengeluaranData.value.filter(item => {
      if (item.hidden) return false;
      const mDate = filterPengeluaran.date === "ALL" || item.tanggal === filterPengeluaran.date;
      const mKas = filterPengeluaran.kasBank === "ALL" || item.kasBank === filterPengeluaran.kasBank;
      const mPenerima = filterPengeluaran.penerima === "ALL" || item.nama === filterPengeluaran.penerima;
      
      // Filter Kategori/Label Transaksi
      let mKat = true;
      if (filterPengeluaran.kategori && filterPengeluaran.kategori !== "ALL") {
        const badge = getCategoryBadge(item);
        mKat = badge.label === filterPengeluaran.kategori;
      }

      let mSource = true;
      if (filterPengeluaran.sourceType === "KAS_TUNAI") mSource = !item.isDirectBankOutflow;
      else if (filterPengeluaran.sourceType === "MATCHED_BANK") mSource = Boolean(item.matchedBridge);
      else if (filterPengeluaran.sourceType === "UNRECORDED_BANK") mSource = !item.matchedBridge && item.isDirectBankOutflow && !item.isMergedGroup;
      else if (filterPengeluaran.sourceType === "MERGED") mSource = Boolean(item.isMergedGroup);

      const q = filterPengeluaran.search.toLowerCase();
      const mQ = !q || item.uraian.toLowerCase().includes(q) || item.nama.toLowerCase().includes(q) || item.namaAkun.toLowerCase().includes(q);
      
      return mDate && mKas && mPenerima && mKat && mSource && mQ;
    });
  });

  const totalDebitPengeluaran = computed(() => filteredPengeluaran.value.reduce((s, i) => s + (i.debet || 0), 0));
  const totalKreditPengeluaran = computed(() => filteredPengeluaran.value.reduce((s, i) => s + (i.kredit || 0), 0));
  const availableDatesPengeluaran = computed(() => Array.from(new Set(pengeluaranData.value.map(i => i.tanggal).filter(Boolean))).sort());
  const availableKasBanksPengeluaran = computed(() => Array.from(new Set(pengeluaranData.value.map(i => i.kasBank).filter(Boolean))).sort());

  const filteredPemasukan = computed(() => {
    return pemasukanData.value.filter(item => {
      const mDate = filterPemasukan.date === "ALL" || item.tglFormatted === filterPemasukan.date;
      const mBank = filterPemasukan.bank === "ALL" || item.kasBank === filterPemasukan.bank;
      const q = filterPemasukan.search.toLowerCase();
      const mQ = !q || item.posPenerimaan.toLowerCase().includes(q) || item.coaBaru.toLowerCase().includes(q) || item.uraianJurnal.toLowerCase().includes(q);
      return mDate && mBank && mQ;
    });
  });

  const totalTransPemasukan = computed(() => filteredPemasukan.value.reduce((s, i) => s + i.jmlTrans, 0));
  const totalNominalPemasukan = computed(() => filteredPemasukan.value.reduce((s, i) => s + i.totalPenerimaan, 0));
  const availableDatesPemasukan = computed(() => Array.from(new Set(pemasukanData.value.map(i => i.tglFormatted).filter(Boolean))).sort());
  const availableBanksPemasukan = computed(() => Array.from(new Set(pemasukanData.value.map(i => i.kasBank).filter(Boolean))).sort());

  const filteredCOAList = computed(() => {
    const q = coaSearchQuery.value.toLowerCase().trim();
    if (!q) return MASTER_COA_LIST;
    return MASTER_COA_LIST.filter(c => c.kode.toLowerCase().includes(q) || c.nama.toLowerCase().includes(q));
  });

  return {
    activeTab, isLoading, loadingMessage, showLPJModal, showBankDetailModal, showMergeModal, showEditModal,
    selectedBankDetailItem, selectedBankBalanceDate, coaSearchQuery, editForm, filesStatus,
    rawKasKecilExpenses, rawBsiOutflows, rawMuamalatOutflows, eliminatedBridges,
    pengeluaranData, pemasukanData, mergeForm, lpjUraian, lpjSummary,
    filterPengeluaran, filterPemasukan, toast,
    showToast, copyNominal, uploadBukuBesar, uploadBsiCsv, uploadMuamalatCsv, uploadPemasukanExcel,
    openMergeModal, confirmMergeGroup, unmergeGroup, calculateLPJGroup, confirmLPJGroup, ungroupLPJ,
    hidePengeluaranRow, restoreHiddenPengeluaran, handlePengeluaranRowAction, handleCopyLPJBundle, handlePemasukanRowAction,
    openEditModal, confirmSaveEdit,
    exportPengeluaranExcel: () => exportPengeluaranToExcel(filteredPengeluaran.value),
    exportPemasukanExcel: () => exportPemasukanToExcel(filteredPemasukan.value),
    resetAll,
    uploadedFilesCount, selectedCountPengeluaran, hiddenPengeluaranCount, allBankAvailableDates,
    computedBankBalances, filteredPengeluaran, totalDebitPengeluaran, totalKreditPengeluaran,
    availableDatesPengeluaran, availableKasBanksPengeluaran, availablePenerimaPengeluaran, availableCategoriesPengeluaran,
    filteredPemasukan, totalTransPemasukan, totalNominalPemasukan, availableDatesPemasukan, availableBanksPemasukan,
    filteredCOAList, expandedLPJGroups, toggleExpandLPJ
  };
}