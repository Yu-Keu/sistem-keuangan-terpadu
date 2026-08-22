/**
 * ======================================================================
 * FILE: src/composables/useFinance.js
 * STATE CONTROLLER & RECONCILIATION ENGINE
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
import { MASTER_BIDANG_LIST } from "../constants/bidang.js";
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
  selectedKodeBidang: "",
  selectedBidang: "",
  rawItemRef: null
});

// State Split Transaksi per Bidang
const showSplitModal = ref(false);
const splitCounter = ref(0);
const splitSourceItem = ref(null);
const splitRows = ref([]);

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

// Filter Pengeluaran, Pemasukan, & Bidang
const filterPengeluaran = reactive({ 
  date: "ALL", 
  kasBank: "ALL", 
  sourceType: "ALL", 
  penerima: "ALL",
  kategori: "ALL",
  search: "" 
});

const filterBidang = reactive({
  kodeBidang: "ALL",
  date: "ALL",
  kasBank: "ALL",
  statusSplit: "ALL", // ALL, SPLIT, UNSPLIT
  search: ""
});

const filterPemasukan = reactive({ date: "ALL", bank: "ALL", search: "" });
const toast = reactive({ show: false, message: "", timeout: null });

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
  // FITUR EDIT UNIVERSAL
  // =========================================================================
  const openEditModal = (item, type = "pengeluaran") => {
    editForm.id = item.id;
    editForm.type = type;
    editForm.rawItemRef = item;

    if (type === "pengeluaran") {
      editForm.uraian = item.uraian;
      editForm.selectedKode = item.kodeAkun || "521010110";
      editForm.selectedNama = item.namaAkun || "Beban Operasional Markaz";
      editForm.selectedKodeBidang = item.kodeBidang || "01";
      editForm.selectedBidang = item.bidang || "Markaz / Pusat";
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
      item.kodeBidang = editForm.selectedKodeBidang;
      item.bidang = editForm.selectedBidang;
    } else {
      item.uraianJurnal = editForm.uraian.trim();
      item.coaBaru = `${editForm.selectedKode} - ${editForm.selectedNama}`;
    }

    showEditModal.value = false;
    showToast("Perubahan COA, Bidang & Deskripsi berhasil disimpan!");
  };

  // =========================================================================
  // FITUR SPLIT TRANSAKSI PER BIDANG / PER COA
  // =========================================================================
  const openSplitModal = (item) => {
    splitSourceItem.value = item;
    const origNominal = Math.abs(item.debet || item.kredit || 0);

    // Initial 2 split rows
    const half1 = Math.round(origNominal / 2);
    const half2 = origNominal - half1;

    splitRows.value = [
      {
        id: "SPLIT-SUB-1",
        kodeBidang: item.kodeBidang || "01",
        bidang: item.bidang || "Markaz / Pusat",
        kodeAkun: item.kodeAkun || "521010110",
        namaAkun: item.namaAkun || "Beban Operasional Markaz",
        uraian: item.uraian,
        nominal: half1
      },
      {
        id: "SPLIT-SUB-2",
        kodeBidang: item.kodeBidang || "01",
        bidang: item.bidang || "Markaz / Pusat",
        kodeAkun: item.kodeAkun || "521010110",
        namaAkun: item.namaAkun || "Beban Operasional Markaz",
        uraian: item.uraian,
        nominal: half2
      }
    ];

    showSplitModal.value = true;
  };

  const addSplitRow = () => {
    const parent = splitSourceItem.value;
    splitRows.value.push({
      id: "SPLIT-SUB-" + (splitRows.value.length + 1),
      kodeBidang: parent?.kodeBidang || "01",
      bidang: parent?.bidang || "Markaz / Pusat",
      kodeAkun: parent?.kodeAkun || "521010110",
      namaAkun: parent?.namaAkun || "Beban Operasional Markaz",
      uraian: parent?.uraian || "",
      nominal: 0
    });
  };

  const removeSplitRow = (index) => {
    if (splitRows.value.length <= 2) {
      alert("Minimal diperlukan 2 baris alokasi untuk split.");
      return;
    }
    splitRows.value.splice(index, 1);
  };

  const confirmSplitTransaction = () => {
    const parent = splitSourceItem.value;
    if (!parent) return;

    const parentNominal = Math.abs(parent.debet || parent.kredit || 0);
    const totalSplit = splitRows.value.reduce((s, r) => s + (parseFloat(r.nominal) || 0), 0);

    if (Math.abs(totalSplit - parentNominal) > 0.01) {
      alert(`Total split (${formatRupiah(totalSplit)}) harus sama persis dengan transaksi asal (${formatRupiah(parentNominal)})!`);
      return;
    }

    splitCounter.value++;
    const splitGroupId = `SPL-GRP-${String(splitCounter.value).padStart(3, '0')}`;

    // Mark parent as split & hide from plain regular listing
    parent.splitGroupId = splitGroupId;
    parent.isSplitParent = true;
    parent.hidden = true;
    parent.splitCount = splitRows.value.length;

    const parentIdx = pengeluaranData.value.findIndex(x => x.id === parent.id);

    const generatedChildren = splitRows.value.map((row, idx) => {
      const isDebet = parent.debet > 0;
      return {
        id: `SPLIT-${parent.id}-${idx + 1}`,
        tanggal: parent.tanggal,
        kodeBidang: row.kodeBidang,
        bidang: row.bidang,
        kodeAkun: row.kodeAkun,
        namaAkun: row.namaAkun,
        uraian: row.uraian,
        bankRawDescription: parent.bankRawDescription || "",
        nama: parent.nama,
        debet: isDebet ? row.nominal : 0,
        kredit: !isDebet ? row.nominal : 0,
        kasBank: parent.kasBank,
        selected: false,
        groupId: null,
        splitGroupId: splitGroupId,
        isSplitChild: true,
        isSplitParent: false,
        splitParentId: parent.id,
        hidden: false,
        wasCopied: false,
        justCopied: false,
        isGenerated: false,
        isDirectBankOutflow: parent.isDirectBankOutflow,
        originalUraian: row.uraian
      };
    });

    if (parentIdx !== -1) {
      pengeluaranData.value.splice(parentIdx + 1, 0, ...generatedChildren);
    } else {
      pengeluaranData.value.push(...generatedChildren);
    }

    showSplitModal.value = false;
    showToast(`Transaksi berhasil di-split menjadi ${splitRows.value.length} alokasi bidang!`);
  };

  const unsplitTransaction = (splitGroupId) => {
    // Remove children
    pengeluaranData.value = pengeluaranData.value.filter(x => !(x.splitGroupId === splitGroupId && x.isSplitChild));

    // Restore parent
    const parent = pengeluaranData.value.find(x => x.splitGroupId === splitGroupId && x.isSplitParent);
    if (parent) {
      parent.splitGroupId = null;
      parent.isSplitParent = false;
      parent.hidden = false;
      parent.splitCount = 0;
    }

    showToast("Split transaksi telah dibatalkan & dikembalikan utuh.");
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
      bItem.kodeBidang = kkCredit.kodeBidang || bItem.kodeBidang;
      bItem.bidang = kkCredit.bidang || bItem.bidang;

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
      const isKasbonClose = isKasbonCOA && (rawLower.includes("pelunasan") || rawLower.includes("tutup") || rawLower.includes("selesai"));
      const rawNom = Math.abs(k.debet !== 0 ? k.debet : k.kredit);
      
      return {
        ...k,
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
      showToast("Buku Besar & Kode Bidang berhasil dimuat!");
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
      kodeBidang: "01",
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
        kodeBidang: first.kodeBidang || "01",
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
    pengeluaranData.value.forEach(i => { if (!i.isMergedChild && !i.isSplitParent) i.hidden = false; });
    showToast("Semua baris tersembunyi dipulihkan.");
  };

  // Payload Actions
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
    const isNegative = (item.totalPenerimaan || 0) < 0;
    const nom = Math.abs(item.totalPenerimaan || 0);
    const tgl = (item.tglFormatted || "").replace(/-/g, '/');

    const posBank = isNegative ? "KREDIT" : "DEBIT";
    const posCOA = isNegative ? "DEBIT" : "KREDIT";

    const payload = [
      `${tgl}|${item.uraianJurnal}`,
      `${item.kasBank}|${posBank}|${nom}`,
      `${item.coaBaru}|${posCOA}|${nom}`
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
    splitCounter.value = 0;
    showToast("Semua data berhasil direset.");
  };

  // =========================================================================
  // COMPUTED PROPERTIES (TERMASUK BIDANG & SPLIT)
  // =========================================================================
  const uploadedFilesCount = computed(() => {
    return (filesStatus.bukuBesar ? 1 : 0) + (filesStatus.bsi ? 1 : 0) + (filesStatus.muamalat ? 1 : 0) + (filesStatus.pemasukan ? 1 : 0);
  });

  const selectedCountPengeluaran = computed(() => {
    return pengeluaranData.value.filter(i => i.selected && !i.groupId && !i.hidden).length;
  });

  const hiddenPengeluaranCount = computed(() => {
    return pengeluaranData.value.filter(i => i.hidden && !i.isMergedChild && !i.isSplitParent).length;
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

  const availableCategoriesPengeluaran = computed(() => {
    const set = new Set();
    pengeluaranData.value.forEach(item => {
      const b = getCategoryBadge(item);
      if (b && b.label) set.add(b.label);
    });
    return Array.from(set);
  });

  // DAFTAR KODE & NAMA BIDANG DARI DATA
  const availableBidangList = computed(() => {
    const map = {};
    // Daftarkan dulu dari MASTER_BIDANG_LIST
    MASTER_BIDANG_LIST.forEach(b => {
      map[b.kode] = b.nama;
    });

    // Tambahkan bidang dinamis yang ditemukan dari file
    pengeluaranData.value.forEach(i => {
      if (i.kodeBidang && i.bidang) {
        map[i.kodeBidang] = i.bidang;
      }
    });

    return Object.keys(map).sort().map(k => ({
      kode: k,
      nama: map[k]
    }));
  });

  const filteredPengeluaran = computed(() => {
    return pengeluaranData.value.filter(item => {
      if (item.hidden) return false;
      const mDate = filterPengeluaran.date === "ALL" || item.tanggal === filterPengeluaran.date;
      const mKas = filterPengeluaran.kasBank === "ALL" || item.kasBank === filterPengeluaran.kasBank;
      const mPenerima = filterPengeluaran.penerima === "ALL" || item.nama === filterPengeluaran.penerima;
      
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

  // DATA TERFILTER KHUSUS TAB BIDANG
  const filteredBidangData = computed(() => {
    return pengeluaranData.value.filter(item => {
      if (item.hidden && !item.isSplitParent) return false;

      // Filter Kode Bidang
      const mBidang = filterBidang.kodeBidang === "ALL" || item.kodeBidang === filterBidang.kodeBidang;
      const mDate = filterBidang.date === "ALL" || item.tanggal === filterBidang.date;
      const mKas = filterBidang.kasBank === "ALL" || item.kasBank === filterBidang.kasBank;

      // Filter Status Split
      let mSplit = true;
      if (filterBidang.statusSplit === "SPLIT") mSplit = Boolean(item.isSplitChild || item.isSplitParent);
      else if (filterBidang.statusSplit === "UNSPLIT") mSplit = !item.isSplitChild && !item.isSplitParent;

      const q = filterBidang.search.toLowerCase().trim();
      const mQ = !q || 
        (item.kodeBidang && item.kodeBidang.toLowerCase().includes(q)) ||
        (item.bidang && item.bidang.toLowerCase().includes(q)) ||
        (item.uraian && item.uraian.toLowerCase().includes(q)) ||
        (item.namaAkun && item.namaAkun.toLowerCase().includes(q)) ||
        (item.nama && item.nama.toLowerCase().includes(q));

      return mBidang && mDate && mKas && mSplit && mQ;
    });
  });

  // Rekap summary nominal per Bidang
  const summaryPerBidang = computed(() => {
    const summary = {};
    availableBidangList.value.forEach(b => {
      summary[b.kode] = { kode: b.kode, nama: b.nama, totalNominal: 0, totalTrx: 0 };
    });

    pengeluaranData.value.forEach(item => {
      if (item.isSplitParent) return; // jangan hitung induk yang sudah di-split
      if (item.hidden) return;

      const k = item.kodeBidang || "01";
      if (!summary[k]) {
        summary[k] = { kode: k, nama: item.bidang || "Lainnya", totalNominal: 0, totalTrx: 0 };
      }
      const nom = Math.abs(item.debet || item.kredit || 0);
      summary[k].totalNominal += nom;
      summary[k].totalTrx += 1;
    });

    return Object.values(summary).filter(s => s.totalTrx > 0);
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
    showSplitModal, splitSourceItem, splitRows,
    selectedBankDetailItem, selectedBankBalanceDate, coaSearchQuery, editForm, filesStatus,
    rawKasKecilExpenses, rawBsiOutflows, rawMuamalatOutflows, eliminatedBridges,
    pengeluaranData, pemasukanData, mergeForm, lpjUraian, lpjSummary,
    filterPengeluaran, filterBidang, filterPemasukan, toast,
    showToast, copyNominal, uploadBukuBesar, uploadBsiCsv, uploadMuamalatCsv, uploadPemasukanExcel,
    openMergeModal, confirmMergeGroup, unmergeGroup, calculateLPJGroup, confirmLPJGroup, ungroupLPJ,
    openSplitModal, addSplitRow, removeSplitRow, confirmSplitTransaction, unsplitTransaction,
    hidePengeluaranRow, restoreHiddenPengeluaran, handlePengeluaranRowAction, handleCopyLPJBundle, handlePemasukanRowAction,
    openEditModal, confirmSaveEdit,
    exportPengeluaranExcel: () => exportPengeluaranToExcel(filteredPengeluaran.value),
    exportPemasukanExcel: () => exportPemasukanToExcel(filteredPemasukan.value),
    resetAll,
    uploadedFilesCount, selectedCountPengeluaran, hiddenPengeluaranCount, allBankAvailableDates,
    computedBankBalances, filteredPengeluaran, totalDebitPengeluaran, totalKreditPengeluaran,
    availableDatesPengeluaran, availableKasBanksPengeluaran, availablePenerimaPengeluaran, availableCategoriesPengeluaran,
    availableBidangList, filteredBidangData, summaryPerBidang,
    filteredPemasukan, totalTransPemasukan, totalNominalPemasukan, availableDatesPemasukan, availableBanksPemasukan,
    filteredCOAList, expandedLPJGroups, toggleExpandLPJ
  };
}