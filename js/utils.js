/*
 * utils.js
 * Fungsi bantu murni: escape HTML, format tanggal/jam/harga (WIB), slot pengambilan, hitung mundur, validasi, hash.
 * Dimuat lewat <script> biasa (bukan module), berurutan: utils.js, data.js, views.js, app.js.
 * Semua file berbagi satu ruang nama global yang sama.
 */

const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const pad = (n) => String(n).padStart(2, '0'),
  ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const day = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return ymd(d);
};
const fmt = (s) =>
  new Date(s + 'T00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
const rp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID'),
  nk = (s) => String(s).replace(/\D/g, '');
const STAT = ['Diterima', 'Diproses', 'Siap diambil', 'Selesai'];
const DS = [
  'Pesanan kami terima dan masuk antrean.',
  'Roti sedang dibuat dan dipanggang.',
  'Roti sudah siap, silakan ambil di toko.',
  'Pesanan sudah diambil. Terima kasih!',
];
const TZ = 'Asia/Jakarta',
  jam = (t) =>
    new Date(t)
      .toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: TZ,
      })
      .replace('.', ':'),
  tgs = (t) =>
    new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: TZ }),
  wk = (t) => tgs(t) + ', ' + jam(t) + ' WIB',
  ago = (m) => new Date(Date.now() - m * 6e4).toISOString(),
  rw = (o) => o.riwayat || [{ s: 'Diterima', t: o.tgl }],
  nowStr = () =>
    new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      timeZone: TZ,
    }) +
    ' · ' +
    jam(new Date()) +
    ' WIB';
const sha = async (s) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
const WB = (d, t) => new Date(d + 'T' + t + ':00+07:00').getTime(),
  TJ = (r) => ({
    jb: r.jb || '08:00',
    jt: r.jt || '17:00',
    jm: r.jm || '09:00',
    js: r.js || '15:00',
  }),
  hm = (s) => {
    const [a, b] = s.split(':');
    return +a * 60 + +b;
  },
  mm = (n) => pad(Math.floor(n / 60)) + ':' + pad(n % 60),
  SL = (r) => {
    const t = TJ(r),
      o = [];
    for (let x = hm(t.jm); x + 60 <= hm(t.js); x += 60) o.push(mm(x) + '–' + mm(x + 60));
    return o;
  },
  sx = (o) => (o.slot ? ', ' + o.slot + ' WIB' : ''),
  slotOpts = (r, s) =>
    r
      ? SL(r)
          .map((x) => /* HTML */ `<option ${x === s ? 'selected' : ''}>${x}</option>`)
          .join('')
      : '',
  cdn = (r) => {
    const d = WB(r.tutup, TJ(r).jt) - Date.now();
    if (d <= 0) return '0 menit';
    const a = Math.floor(d / 864e5),
      h = Math.floor((d % 864e5) / 36e5),
      m = Math.floor((d % 36e5) / 6e4);
    return a > 0 ? a + ' hari ' + h + ' jam' : h > 0 ? h + ' jam ' + m + ' menit' : m + ' menit';
  };
const val = (o) => {
  const e = [];
  if (String(o.nama || '').trim().length < 2) e.push('Nama minimal 2 karakter.');
  const k = nk(o.kontak || '');
  if (k.length < 9 || k.length > 15) e.push('Nomor kontak harus berupa angka (9–15 digit).');
  return e;
};
