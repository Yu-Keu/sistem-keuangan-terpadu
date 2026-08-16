/**
 * ======================================================================
 * FILE: src/utils/formatters.js
 * HELPER FORMAT MATA UANG, TANGGAL, & STANDARDISASI URAIAN JURNAL
 * ======================================================================
 */

export function parseIndonesianNumber(val) {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  let str = String(val).trim();
  if (str === "-" || str === "") return 0;
  const isNegative = str.startsWith("-") || (str.startsWith("(") && str.endsWith(")"));
  str = str.replace(/Rp|\s/gi, "").replace(/[()]/g, "");

  if (str.includes(",") && str.includes(".")) {
    if (str.indexOf(",") < str.indexOf(".")) {
      str = str.replace(/,/g, "");
    } else {
      str = str.replace(/\./g, "").replace(",", ".");
    }
  } else if (str.includes(",") && !str.includes(".")) {
    const parts = str.split(",");
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      str = str.replace(/,/g, "");
    } else {
      str = str.replace(",", ".");
    }
  } else if (str.includes(".") && !str.includes(",")) {
    const parts = str.split(".");
    if (parts.length > 2) {
      str = str.replace(/\./g, "");
    } else if (parts.length === 2) {
      if (parts[1].length === 3) {
        str = str.replace(/\./g, "");
      }
    }
  }

  const num = parseFloat(str) || 0;
  return isNegative ? -Math.abs(num) : num;
}

export function formatRupiah(num) {
  if (!num || num === 0) return "Rp 0";
  const f = new Intl.NumberFormat("id-ID").format(Math.abs(num));
  return num < 0 ? `Rp (${f})` : `Rp ${f}`;
}

export function formatBankDateString(str) {
  if (!str) return "";
  str = str.trim();
  
  if (str.includes("-") && str.split("-")[0].length === 4) {
    const p = str.split("-");
    return `${p[2].padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[0]}`;
  }
  
  if (str.includes("-")) {
    const p = str.split("-");
    if (p.length === 3) {
      const months = { 
        jan: "01", feb: "02", mar: "03", apr: "04", may: "05", mei: "05", 
        jun: "06", jul: "07", aug: "08", agt: "08", agu: "08", sep: "09", 
        oct: "10", okt: "10", nov: "11", dec: "12", des: "12" 
      };
      const m = months[p[1].toLowerCase()] || p[1].padStart(2, "0");
      const y = p[2].length === 2 ? "20" + p[2] : p[2];
      return `${p[0].padStart(2, "0")}/${m}/${y}`;
    }
  }
  return str;
}

export function parseSortableTimestamp(dStr) {
  if (!dStr) return 0;
  const p = dStr.split("/");
  if (p.length === 3) {
    return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])).getTime();
  }
  return 0;
}

export function toTitleCase(str) {
  if (!str) return "";
  const lowers = ["dan", "di", "ke", "dari", "untuk", "pada", "a.n.", "qq", "ke-", "tgl", "bln", "kls", "an"];
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word, idx) => {
      if (idx > 0 && lowers.includes(word)) return word;
      if (word.startsWith("tp") || word.startsWith("psb") || word.startsWith("bsi") || word.startsWith("sd") || word.startsWith("smp") || word.startsWith("mts") || word.startsWith("ma") || word.startsWith("mi")) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function standardizeExpenseDescription(rawUraian, rawNama = "", kodeAkun = "", kasBank = "") {
  let text = String(rawUraian || "").trim();
  let nama = String(rawNama || "").trim();
  if (nama === "-" || nama.toLowerCase() === "bank") nama = "";

  text = text
    .replace(/^transfer\s+(pembelian|bayar|pelunasan|biaya)?\s*/gi, "")
    .replace(/^bayar\s+/gi, "")
    .replace(/^pembelian\s+/gi, "")
    .replace(/\s+dab\s+/gi, " dan ")
    .replace(/\s+spikotes\s+/gi, " psikotes ")
    .replace(/a\.n\.\s*/gi, "a.n. ")
    .replace(/\s+/g, " ")
    .trim();

  let detailInBrackets = "";
  const bracketMatch = text.match(/\((.*?)\)/);
  if (bracketMatch) {
    detailInBrackets = bracketMatch[1].trim();
    text = text.replace(/\(.*?\)/g, "").trim();
  }

  const kode = String(kodeAkun || "");
  const u = text.toUpperCase();
  const rawLower = String(rawUraian || "").toLowerCase();

  if (kode.startsWith("11203") || u.includes("PINJAMAN")) {
    let targetNama = nama;
    if (!targetNama) {
      const matchAn = text.match(/a\.n\.\s*([A-Za-z\s]+)/i);
      if (matchAn) targetNama = matchAn[1].trim();
    }
    const cleanKeperluan = detailInBrackets ? toTitleCase(detailInBrackets) : toTitleCase(text.replace(/pinjaman\s*(pribadi)?\s*(a\.n\.\s*[A-Za-z\s]+)?/gi, "").trim());
    return `Pinjaman Pegawai: ${toTitleCase(targetNama || "Pegawai")}${cleanKeperluan ? ` (${cleanKeperluan})` : ""}`;
  }

  if (kode.startsWith("11302") || u.includes("KAS BON") || u.includes("KASBON") || u.includes("UANG MUKA")) {
    const isPelunasan = rawLower.includes("pelunasan") || rawLower.includes("tutup") || rawLower.includes("selesai");
    let cleanObj = text
      .replace(/^pelunasan\s*(kas\s*bon|uang\s*muka)?\s*/gi, "")
      .replace(/^kas\s*bon\s*/gi, "")
      .replace(/^uang\s*muka\s*/gi, "")
      .trim();

    cleanObj = toTitleCase(cleanObj || "Operasional Markaz");
    const prefix = isPelunasan ? "Pelunasan Kasbon:" : "Uang Muka (Kasbon):";
    const namaPart = nama ? ` (a.n. ${toTitleCase(nama)})` : "";
    const extraBracket = detailInBrackets ? ` [${toTitleCase(detailInBrackets)}]` : "";

    return `${prefix} ${cleanObj}${namaPart}${extraBracket}`;
  }

  if (kode.startsWith("2130101") || u.includes("UANG SAKU") || u.includes("TITIPAN")) {
    const cleanObj = toTitleCase(text);
    const namaPart = nama ? ` (${toTitleCase(nama)})` : "";
    return `Penyaluran Titipan: ${cleanObj}${namaPart}`;
  }

  if (u.includes("REFUND") || u.includes("PENGEMBALIAN DANA")) {
    let cleanObj = text.replace(/^refund\s*/gi, "").replace(/^pengembalian\s*dana\s*/gi, "").trim();
    return `Pengembalian Dana (Refund): ${toTitleCase(cleanObj)}${nama ? ` (a.n. ${toTitleCase(nama)})` : ""}`;
  }

  if (kode === "621010101" || u.includes("PEMINDAHBUKUAN E-BANKING") || u.includes("BIAYA ADMIN")) {
    const bankName = kasBank ? kasBank.replace(/Bank /gi, "") : "Bank";
    return `Biaya Administrasi Bank ${bankName} (e-Banking)`;
  }

  if (kode === "521010120" || u.includes("BUKU") || u.includes("PERCETAKAN")) {
    const cleanObj = toTitleCase(text);
    const namaPart = nama ? ` (${toTitleCase(nama)})` : "";
    return `Pengadaan Buku: ${cleanObj}${namaPart}`;
  }

  if (kode === "521010113") {
    const cleanObj = toTitleCase(text);
    const namaPart = nama ? ` (${toTitleCase(nama)})` : "";
    return `Belanja Dapur: ${cleanObj}${namaPart}`;
  }

  if (kode === "521010126") {
    const cleanObj = toTitleCase(text);
    const namaPart = nama ? ` (${toTitleCase(nama)})` : "";
    return `Beban Kegiatan: ${cleanObj}${namaPart}`;
  }

  const cleanObj = toTitleCase(text);
  const namaPart = nama ? ` (${toTitleCase(nama)})` : "";
  const bracketPart = detailInBrackets ? ` [${toTitleCase(detailInBrackets)}]` : "";

  return `Pembayaran: ${cleanObj}${namaPart}${bracketPart}`;
}

export function getCategoryBadge(item) {
  const kode = String(item.kodeAkun || "");
  const uraian = String(item.uraian || "").toUpperCase();

  if (item.isGenerated || item.groupId) return { label: "LPJ", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  if (kode.startsWith("11302") || uraian.includes("UANG MUKA") || uraian.includes("KASBON")) return { label: "KASBON", bg: "bg-sky-100 text-sky-800 border-sky-200" };
  if (kode.startsWith("11203") || uraian.includes("PINJAMAN")) return { label: "PINJAMAN", bg: "bg-amber-100 text-amber-800 border-amber-200" };
  if (kode.startsWith("21301") || uraian.includes("TITIPAN")) return { label: "TITIPAN", bg: "bg-purple-100 text-purple-800 border-purple-200" };
  if (kode === "621010101" || uraian.includes("ADMIN")) return { label: "ADMIN BANK", bg: "bg-slate-200 text-slate-700 border-slate-300" };
  if (uraian.includes("REFUND")) return { label: "REFUND", bg: "bg-rose-100 text-rose-800 border-rose-200" };
  if (kode === "521010113") return { label: "DAPUR", bg: "bg-orange-100 text-orange-800 border-orange-200" };
  
  return { label: "PENGELUARAN", bg: "bg-slate-100 text-slate-600 border-slate-200" };
}