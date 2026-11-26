/*
 * data.js
 * Data dan penyimpanan: akun staf, state aplikasi, menu bawaan, data awal, localStorage, kuota, status periode, notifikasi, sesi.
 * Dimuat lewat <script> biasa (bukan module), berurutan: utils.js, data.js, views.js, app.js.
 * Semua file berbagi satu ruang nama global yang sama.
 */

const K = 'po_v1';
// ============================================================
// Akun staf dan state aplikasi
// ============================================================
// FR-27, FR-29, FR-30: akun staf kini disimpan sebagai daftar (db.pengguna), bukan objek H statis,
// agar admin dapat menambah dan mengubah akun pegawai. Hash awal (demo) tetap sama seperti sebelumnya.
const SEED_HASH = {
  admin: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  pegawai: 'ddf13b95f038a3a8bd3e520347dc38ee4f4e6b5055eed182a49d18aa2cdaf2dc',
};
let db,
  kf = '',
  ts = false,
  sel = '',
  conf = '',
  tab = 'pesanan',
  edit = '',
  aked = '', // FR-29/30: id (username) akun pegawai yang sedang diedit, atau 'baru'
  fv = {},
  errs = [],
  qf = '',
  stRes = null,
  stErr = '';
// ============================================================
// Menu bawaan dan ilustrasi
// ============================================================
const GN = {
    sobek: 'Roti sobek',
    croissant: 'Croissant',
    keju: 'Roti keju pisang',
    donat: 'Donat',
    cinnamon: 'Cinnamon roll',
    baguette: 'Baguette',
    gandum: 'Roti gandum',
    bagel: 'Bagel',
    melonpan: 'Melon pan',
    muffin: 'Muffin',
  },
  GM = Object.keys(GN),
  gu = (p) => '#' + (GM.includes(p.gam) ? 'p-' + p.gam : 'i-loaf'),
  KAT = ['Manis', 'Gurih', 'Pastry'];
const MENU = [
  {
    nama: 'Donat Gula Halus',
    d: 'Donat empuk dengan taburan gula halus.',
    h: 12000,
    k: 'Manis',
    g: 'donat',
    q: 30,
    b: -1,
    t: 400,
    a: 403,
  },
  {
    nama: 'Cinnamon Roll Keju',
    d: 'Gulungan kayu manis dengan frosting krim keju.',
    h: 28000,
    k: 'Pastry',
    g: 'cinnamon',
    q: 12,
    b: -1,
    t: 5,
    a: 7,
    jm: '10:00',
    js: '16:00',
  },
  {
    nama: 'Baguette Original',
    d: 'Baguette renyah di luar, lembut di dalam.',
    h: 20000,
    k: 'Gurih',
    g: 'baguette',
    q: 15,
    b: -1,
    t: 3,
    a: 5,
  },
  {
    nama: 'Roti Gandum Utuh',
    d: 'Roti gandum utuh bertabur biji-bijian.',
    h: 30000,
    k: 'Gurih',
    g: 'gandum',
    q: 8,
    b: 2,
    t: 6,
    a: 8,
  },
  {
    nama: 'Bagel Wijen',
    d: 'Bagel padat dan kenyal dengan taburan wijen.',
    h: 16000,
    k: 'Gurih',
    g: 'bagel',
    q: 18,
    b: -1,
    t: 5,
    a: 7,
  },
  {
    nama: 'Melon Pan',
    d: 'Roti lembut berlapis kulit biskuit renyah.',
    h: 19000,
    k: 'Manis',
    g: 'melonpan',
    q: 14,
    b: -4,
    t: -1,
    a: 2,
  },
  {
    nama: 'Muffin Blueberry',
    d: 'Muffin lembut dengan buah blueberry.',
    h: 15000,
    k: 'Manis',
    g: 'muffin',
    q: 24,
    b: -1,
    t: 6,
    a: 8,
  },
];
function addMenu() {
  MENU.forEach((m) => {
    if (db.produk.some((p) => p.nama === m.nama)) return;
    const pid = 'P' + ++db.n.p,
      rid = 'R' + ++db.n.r;
    db.produk.push({
      id: pid,
      nama: m.nama,
      deskripsi: m.d,
      harga: m.h,
      kat: m.k,
      gam: m.g,
      foto: '',
    });
    db.periode.push({
      id: rid,
      produkId: pid,
      buka: day(m.b),
      tutup: day(m.t),
      ambil: day(m.a),
      kuota: m.q,
      jb: '08:00',
      jt: '17:00',
      jm: m.jm || '09:00',
      js: m.js || '15:00',
    });
  });
}
// FR-27/29/30: akun pegawai disimpan di db.pengguna (bukan konstanta H), tiap akun punya status aktif/nonaktif.
function seedAkun() {
  return [
    { username: 'admin', nama: 'Admin Toko', hash: SEED_HASH.admin, peran: 'Admin', status: 'aktif' },
    { username: 'pegawai', nama: 'Pegawai Toko', hash: SEED_HASH.pegawai, peran: 'Pegawai', status: 'aktif' },
  ];
}
function migrate() {
  if ((db.v || 0) < 2) {
    const g = { P1: ['sobek', 'Manis'], P2: ['croissant', 'Pastry'], P3: ['keju', 'Manis'] };
    db.produk.forEach((p) => {
      if (g[p.id] && !p.gam) {
        p.gam = g[p.id][0];
        p.kat = g[p.id][1];
      }
    });
    addMenu();
    db.v = 2;
  }
  // FR-29/30: migrasi data lama (localStorage) yang belum punya daftar akun pegawai.
  if ((db.v || 0) < 3) {
    if (!Array.isArray(db.pengguna) || !db.pengguna.length) db.pengguna = seedAkun();
    db.v = 3;
  }
  save();
}
function seed() {
  const now = new Date().toISOString();
  db = {
    n: { o: 3, p: 3, r: 3, t: 0, m: 0, f: 0 },
    pengguna: seedAkun(), // FR-27, FR-29, FR-30
    produk: [
      {
        id: 'P1',
        nama: 'Roti Sobek Cokelat',
        deskripsi: 'Roti sobek lembut isi cokelat.',
        harga: 25000,
        kat: 'Manis',
        gam: 'sobek',
        foto: '',
      },
      {
        id: 'P2',
        nama: 'Croissant Mentega',
        deskripsi: 'Croissant renyah dengan mentega.',
        harga: 18000,
        kat: 'Pastry',
        gam: 'croissant',
        foto: '',
      },
      {
        id: 'P3',
        nama: 'Roti Keju Pisang',
        deskripsi: 'Roti isi keju dan pisang.',
        harga: 22000,
        kat: 'Manis',
        gam: 'keju',
        foto: '',
      },
    ],
    periode: [
      { id: 'R1', produkId: 'P1', buka: day(-1), tutup: day(400), ambil: day(403), kuota: 20 },
      { id: 'R2', produkId: 'P2', buka: day(-1), tutup: day(400), ambil: day(403), kuota: 10 },
      { id: 'R3', produkId: 'P3', buka: day(-1), tutup: day(400), ambil: day(403), kuota: 6 },
    ],
    pesanan: [
      {
        kode: 'PO-0001',
        tgl: ago(95),
        riwayat: [{ s: 'Diterima', t: ago(95) }],
        periodeId: 'R1',
        jumlah: 8,
        total: 200000,
        nama: 'Contoh Pelanggan A',
        kontak: '081200000001',
        jadwal: day(7),
        slot: '09:00–10:00',
        antrean: 1,
        status: 'Diterima',
      },
      {
        kode: 'PO-0002',
        tgl: ago(180),
        riwayat: [
          { s: 'Diterima', t: ago(180) },
          { s: 'Diproses', t: ago(40) },
        ],
        periodeId: 'R2',
        jumlah: 7,
        total: 126000,
        nama: 'Contoh Pelanggan B',
        kontak: '081200000002',
        jadwal: day(7),
        slot: '10:00–11:00',
        antrean: 1,
        status: 'Diproses',
      },
      {
        kode: 'PO-0003',
        tgl: ago(25),
        riwayat: [{ s: 'Diterima', t: ago(25) }],
        periodeId: 'R3',
        jumlah: 6,
        total: 132000,
        nama: 'Contoh Pelanggan C',
        kontak: '081200000003',
        jadwal: day(7),
        slot: '13:00–14:00',
        antrean: 1,
        status: 'Diterima',
      },
    ],
    tunggu: [],
    minta: [],
    notif: [],
  };
  addMenu();
  db.v = 3;
}
// ============================================================
// Memuat dan menyimpan data (localStorage)
// ============================================================
try {
  db = JSON.parse(localStorage.getItem(K));
  if (!db || !db.produk) throw 0;
} catch (e) {
  seed();
}
const save = () => {
  try {
    localStorage.setItem(K, JSON.stringify(db));
  } catch (e) {}
};
migrate();
// ============================================================
// Pencarian data, kuota, dan status periode
// ============================================================
const P = (id) => db.produk.find((x) => x.id === id),
  R = (id) => db.periode.find((x) => x.id === id),
  RP = (pid) => db.periode.find((x) => x.produkId === pid);
// FR-29/30: pencarian akun pegawai/admin
const AK = (u) => db.pengguna.find((x) => x.username === u);
const used = (r) =>
    db.pesanan.filter((o) => o.periodeId === r.id).reduce((s, o) => s + o.jumlah, 0),
  sisa = (r) => r.kuota - used(r);
const st = (r) => {
  const n = Date.now();
  return n < WB(r.buka, TJ(r).jb)
    ? 'Belum dibuka'
    : n > WB(r.tutup, TJ(r).jt)
      ? 'Ditutup'
      : sisa(r) <= 0
        ? 'Habis'
        : 'Tersedia';
};
// ============================================================
// Daftar tunggu: posisi (FR-24) dan pemrosesan otomatis saat restock (FR-34–37)
// ============================================================
// FR-24: posisi dihitung dari urutan waktu pendaftaran pada daftar tunggu produk yang sama.
const posisiTunggu = (t) =>
  db.tunggu.filter((x) => x.periodeId === t.periodeId).sort((a, b) => new Date(a.waktu) - new Date(b.waktu)).indexOf(t) + 1;

// FR-34, FR-35, FR-36, FR-37 (Use Case "Memproses Daftar Tunggu Saat Restock", Scenario #14):
// dipanggil dari app.js tepat setelah kuota produk yang sebelumnya habis bertambah.
function prosesRestock(r) {
  const p = P(r.produkId),
    antre = db.tunggu
      .filter((t) => t.periodeId === r.id)
      .sort((a, b) => new Date(a.waktu) - new Date(b.waktu)); // FR-34: urutan waktu pendaftaran
  for (const t of antre) {
    if (sisa(r) <= 0) break; // Alternatif 1: daftar tunggu habis diperiksa / kuota habis lagi
    if (t.jumlah > sisa(r)) continue; // Alternatif 2 (FR-36): sisa kuota tidak mencukupi, tetap di daftar tunggu
    // FR-35: simpan pesanan otomatis, kurangi sisa kuota, buat nomor antrean seperti pesanan biasa
    const kode = 'PO-' + String(++db.n.o).padStart(4, '0'),
      ob = {
        kode,
        tgl: new Date().toISOString(),
        periodeId: r.id,
        jumlah: t.jumlah,
        total: p.harga * t.jumlah,
        nama: t.nama,
        kontak: t.kontak,
        jadwal: r.ambil,
        slot: SL(r)[0] || '',
        antrean: db.pesanan.filter((y) => y.periodeId === r.id).length + 1,
        status: 'Diterima',
        riwayat: [{ s: 'Diterima', t: new Date().toISOString() }],
        otomatis: true,
      };
    db.pesanan.push(ob);
    db.tunggu = db.tunggu.filter((x) => x !== t);
    // FR-37: kirim konfirmasi ke pelanggan yang bersangkutan
    notify(
      t.kontak,
      'konfirmasi',
      `Pesanan ${kode} untuk ${p.nama} sebanyak ${t.jumlah} berhasil dibuat otomatis karena kuota tersedia kembali. Nomor antrean Anda: ${ob.antrean}.`,
    );
  }
  // Sisa pelanggan di daftar tunggu (jika ada) otomatis mendapat posisi baru lewat posisiTunggu() saat ditampilkan (FR-36).
}
// ============================================================
// Notifikasi dan sesi staf
// ============================================================
const notify = (to, jenis, isi) =>
  db.notif.unshift({ id: ++db.n.f, waktu: new Date().toISOString(), kepada: to, jenis, isi });
const link = () => location.href.split('#')[0] + '#produk';
const ses = () => {
  try {
    const s = JSON.parse(sessionStorage.getItem('po_s'));
    if (s && Date.now() - s.t < 18e5) return s;
  } catch (e) {}
  return null;
};
const touch = () => {
  const s = ses();
  if (s) {
    s.t = Date.now();
    try {
      sessionStorage.setItem('po_s', JSON.stringify(s));
    } catch (e) {}
  }
};