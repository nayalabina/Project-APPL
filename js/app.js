/*
 * app.js
 * Pintu masuk aplikasi: render, dialog, penanganan klik/ubah/kirim form, jam dan hitung mundur otomatis.
 * Dimuat lewat <script> biasa (bukan module), berurutan: utils.js, data.js, views.js, app.js.
 * Semua file berbagi satu ruang nama global yang sama.
 */

const A = document.getElementById('app'),
  D = document.getElementById('dlg'),
  T = document.getElementById('toast');
// ============================================================
// Pembantu UI dan render halaman
// ============================================================
const toast = (m) => {
  T.textContent = m;
  T.className = 'on';
  setTimeout(() => (T.className = ''), 2600);
};
const go = (h) => {
  if (location.hash === '#' + h) render();
  else location.hash = h;
};
function render() {
  const h = (location.hash || '#produk').slice(1),
    s = ses();
  let v;
  if (h === 'admin') {
    if (!s) {
      location.hash = '#masuk';
      return;
    }
    touch();
    v = vAdmin(s);
  } else if (h === 'masuk') {
    if (s) {
      location.hash = '#admin';
      return;
    }
    v = vMasuk();
  } else if (h === 'pesan') v = vPesan();
  else if (h === 'status') v = vStatus();
  else v = vProduk();
  A.innerHTML = v;
  document.body.classList.toggle('lgn', h === 'masuk');
  document.getElementById('nav').innerHTML = [
    ['produk', 'Produk'],
    ['pesan', 'Pesan'],
    ['status', 'Status'],
    [s ? 'admin' : 'masuk', s ? 'Pengelolaan' : 'Masuk staf'],
  ]
    .map(
      ([k, l]) =>
        /* HTML */ `<a
          href="#${k}"
          ${h === k || (h === 'admin' && k === 'masuk') ? 'aria-current="page"' : ''}
          >${l}</a
        >`,
    )
    .join('');
}
// ============================================================
// Dialog
// ============================================================
function dlg(h) {
  D.innerHTML = h;
  if (!D.open) D.showModal();
}
function mt(k, id) {
  const r = R(id),
    p = P(r.produkId);
  dlg(
    /* HTML */ `<form class="f" data-f="mt" data-k="${k}" data-id="${id}" novalidate>
      <strong
        >${k === 'minta' ? 'Beritahu saya saat kuota tersedia' : 'Daftar tunggu'}:
        ${esc(p.nama)}</strong
      >
      <div id="de"></div>
      <label>Nama<input name="nama" autocomplete="name" /></label
      ><label>Nomor kontak<input name="kontak" inputmode="tel" autocomplete="tel" /></label
      >${k === 'tunggu' ? '<label>Jumlah diminta<input name="jumlah" type="number" min="1" max="99" value="1"></label>' : ''}
      <div class="r">
        <button class="b" type="submit">Kirim</button
        ><button type="button" class="b o" data-a="tutup">Batal</button>
      </div>
    </form>`,
  );
}
// ============================================================
// Interaksi: klik, ubah isian, kirim form
// ============================================================
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-a]');
  if (!b) return;
  touch();
  const a = b.dataset.a,
    id = b.dataset.id;
  if (a === 'pesan') {
    sel = id;
    conf = '';
    fv = {};
    errs = [];
    qf = '';
    go('pesan');
  } else if (a === 'mt') mt(b.dataset.k, id);
  else if (a === 'kat') {
    kf = id;
    render();
  } else if (a === 'ts') {
    ts = !ts;
    render();
  } else if (a === 'pw') {
    const i = document.getElementById('pw'),
      h = i.type === 'password';
    i.type = h ? 'text' : 'password';
    b.setAttribute('aria-pressed', h);
    b.setAttribute('aria-label', h ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
  } else if (a === 'demo') {
    const f = document.querySelector('form[data-f="login"]');
    f.elements.u.value = id;
    f.elements.p.value = id + '123';
    f.elements.p.focus();
  } else if (a === 'tutup') D.close();
  else if (a === 'lagi') {
    conf = '';
    fv = {};
    errs = [];
    render();
  } else if (a === 'tab') {
    tab = id;
    edit = '';
    aked = '';
    fv = {};
    errs = [];
    render();
  } else if (a === 'edit') {
    edit = id;
    fv = {};
    errs = [];
    render();
  } else if (a === 'batal') {
    edit = '';
    fv = {};
    errs = [];
    render();
  } else if (a === 'akunedit') {
    // FR-29/30, UC-15: buka form tambah/ubah akun pegawai
    aked = id;
    fv = {};
    errs = [];
    render();
  } else if (a === 'akunbatal') {
    aked = '';
    fv = {};
    errs = [];
    render();
  } else if (a === 'akunstatus') {
    // FR-30: admin mengubah status akun (aktif/nonaktif) tanpa form
    const u = AK(id);
    if (u) {
      u.status = u.status === 'aktif' ? 'nonaktif' : 'aktif';
      save();
      toast(`Akun ${u.username} sekarang ${u.status}.`);
    }
    render();
  } else if (a === 'keluar') {
    sessionStorage.removeItem('po_s');
    go('produk');
  } else if (a === 'ss') {
    const o = db.pesanan.find((x) => x.kode === id),
      v = document.querySelector(`select[data-k="${id}"]`).value;
    if (v !== o.status) {
      o.status = v;
      (o.riwayat = rw(o)).push({ s: v, t: new Date().toISOString() });
      notify(o.kontak, 'status', `Status pesanan ${o.kode} berubah menjadi ${v}.`);
      save();
      toast('Status diperbarui pukul ' + jam(new Date()) + ' WIB, notifikasi dikirim.');
    } else toast('Status tidak berubah.');
    render();
  } else if (a === 'hapus') {
    const p = P(id),
      r = RP(id);
    if (db.pesanan.some((o) => o.periodeId === r.id))
      dlg(
        /* HTML */ `<div class="f">
          <div class="al">
            Produk ${esc(p.nama)} sudah memiliki pesanan sehingga tidak dapat dihapus.
          </div>
          <button class="b o" data-a="tutup">Tutup</button>
        </div>`,
      );
    else
      dlg(
        /* HTML */ `<div class="f">
          <strong>Hapus ${esc(p.nama)}?</strong>
          <div class="mu">Tindakan ini tidak dapat dibatalkan.</div>
          <div class="r">
            <button class="b d" data-a="hy" data-id="${id}">Hapus</button
            ><button class="b o" data-a="tutup">Batal</button>
          </div>
        </div>`,
      );
  } else if (a === 'hy') {
    const r = RP(id);
    db.produk = db.produk.filter((p) => p.id !== id);
    db.periode = db.periode.filter((x) => x.id !== r.id);
    db.tunggu = db.tunggu.filter((x) => x.periodeId !== r.id);
    db.minta = db.minta.filter((x) => x.periodeId !== r.id);
    save();
    D.close();
    toast('Produk dihapus.');
    render();
  }
});
document.addEventListener('change', (e) => {
  if (e.target.id === 'sp') {
    const r = R(e.target.value);
    document.getElementById('jd').textContent =
      'Jadwal pengambilan: ' + fmt(r.ambil) + ', ' + TJ(r).jm + '–' + TJ(r).js + ' WIB';
    document.getElementById('sl').innerHTML = slotOpts(r);
  }
});
document.addEventListener('submit', async (e) => {
  e.preventDefault();
  touch();
  const f = e.target.dataset.f,
    o = Object.fromEntries(new FormData(e.target));
  if (f === 'pesan') {
    fv = o;
    errs = [];
    qf = '';
    const r = R(o.periode),
      j = parseInt(o.jumlah, 10),
      x = val(o);
    if (!r || st(r) !== 'Tersedia') x.push('Pilih produk yang sedang tersedia.');
    if (r && !SL(r).includes(o.slot)) x.push('Pilih jam pengambilan yang tersedia.');
    if (!(j >= 1 && j <= 99)) x.push('Jumlah harus 1 sampai 99.');
    if (!x.length && j > sisa(r)) {
      x.push(
        `Jumlah pesanan (${j}) melebihi sisa kuota (${sisa(r)}). Kurangi jumlah, atau pilih beritahu saya atau daftar tunggu.`,
      );
      qf = r.id;
    }
    if (x.length) {
      errs = x;
      render();
      return;
    }
    const p = P(r.produkId),
      kode = 'PO-' + String(++db.n.o).padStart(4, '0'),
      k = nk(o.kontak),
      ob = {
        kode,
        tgl: new Date().toISOString(),
        periodeId: r.id,
        jumlah: j,
        total: p.harga * j,
        nama: o.nama.trim(),
        kontak: k,
        jadwal: r.ambil,
        slot: o.slot,
        antrean: db.pesanan.filter((y) => y.periodeId === r.id).length + 1,
        status: 'Diterima',
        riwayat: [{ s: 'Diterima', t: new Date().toISOString() }],
      };
    db.pesanan.push(ob);
    notify(
      k,
      'konfirmasi',
      `Pesanan ${kode} untuk ${p.nama} sebanyak ${j} berhasil. Nomor antrean Anda: ${ob.antrean}. Jadwal pengambilan: ${fmt(r.ambil)}, ${o.slot} WIB.`,
    );
    save();
    conf = kode;
    fv = {};
    errs = [];
    render();
  } else if (f === 'mt') {
    const r = R(e.target.dataset.id),
      k = e.target.dataset.k,
      x = val(o),
      t = nk(o.kontak || ''),
      de = document.getElementById('de');
    if (k === 'tunggu' && !(parseInt(o.jumlah, 10) >= 1)) x.push('Jumlah diminta minimal 1.');
    if (x.length) {
      de.innerHTML = al(x.join('<br>'));
      return;
    }
    const L = k === 'minta' ? db.minta : db.tunggu;
    if (L.some((y) => y.periodeId === r.id && y.kontak === t)) {
      de.innerHTML = al('Nomor ini sudah terdaftar untuk produk tersebut.');
      return;
    }
    const entry = {
      id: ++db.n[k === 'minta' ? 'm' : 't'],
      periodeId: r.id,
      nama: o.nama.trim(),
      kontak: t,
      jumlah: parseInt(o.jumlah, 10) || 0,
      waktu: new Date().toISOString(),
    };
    L.push(entry);
    save();
    // FR-25: konfirmasi posisi daftar tunggu (bukan nomor antrean pesanan, karena pesanan belum tersimpan)
    const pos = k === 'tunggu' ? posisiTunggu(entry) : null;
    if (k === 'tunggu')
      notify(
        t,
        'tunggu',
        `Anda masuk daftar tunggu ${P(r.produkId).nama} pada posisi ${pos}. Jumlah yang diminta: ${entry.jumlah}. Tanggal pendaftaran: ${wk(entry.waktu)}.`,
      );
    dlg(
      /* HTML */ `<div class="f">
        ${al(k === 'minta' ? 'Permintaan tercatat. Anda akan diberi tahu saat kuota tersedia kembali.' : `Anda masuk daftar tunggu. Posisi daftar tunggu Anda: ${pos}.`, 'ok')}<button
          class="b o"
          data-a="tutup"
        >
          Tutup
        </button>
      </div>`,
    );
    render();
  } else if (f === 'status') {
    const k = nk(o.kontak || ''),
      c = String(o.kode || '')
        .trim()
        .toUpperCase(),
      num = /^\d{1,4}$/.test(c);
    stRes = db.pesanan.filter((x) => x.kontak === k && (num ? x.antrean === +c : x.kode === c));
    if (!stRes.length) stRes = null;
    stErr = stRes
      ? ''
      : 'Pesanan tidak ditemukan. Periksa kode pesanan atau nomor antrean, dan nomor kontak.';
    qf = c;
    render();
  } else if (f === 'login') {
    // FR-27: verifikasi username dan kata sandi terhadap daftar akun (db.pengguna), bukan lagi konstanta H.
    const u = String(o.u || '')
        .trim()
        .toLowerCase(),
      h = await sha(o.p || ''),
      akun = AK(u);
    if (akun && akun.status === 'aktif' && akun.hash === h) {
      sessionStorage.setItem(
        'po_s',
        JSON.stringify({ u: akun.username, nama: akun.nama, peran: akun.peran, t: Date.now() }),
      );
      stErr = '';
      fv = {};
      tab = 'pesanan';
      go('admin');
    } else if (akun && akun.status === 'nonaktif') {
      stErr = 'Akun Anda tidak aktif, hubungi Admin.';
      fv = { lu: u };
      render();
    } else {
      stErr = 'Username atau kata sandi salah.';
      fv = { lu: u };
      render();
    }
  } else if (f === 'akun') {
    // FR-29/30, UC-15: tambah atau ubah akun pegawai (hanya dapat diakses admin, lihat views.js)
    const id = e.target.dataset.id,
      x = [],
      uname = String(o.username || '').trim().toLowerCase();
    fv = { akun: o };
    if (String(o.nama || '').trim().length < 2) x.push('Nama wajib diisi (minimal 2 karakter).');
    if (!/^[a-z0-9_]{3,20}$/.test(uname)) x.push('Username 3–20 karakter: huruf kecil, angka, underscore.');
    else if (db.pengguna.some((u) => u.username === uname && u.username !== id))
      x.push('Username sudah dipakai, pilih yang lain.');
    if (id === 'baru' && String(o.password || '').length < 4) x.push('Kata sandi minimal 4 karakter.');
    if (x.length) {
      errs = x;
      render();
      return;
    }
    if (id === 'baru') {
      db.pengguna.push({
        username: uname,
        nama: o.nama.trim(),
        hash: await sha(o.password),
        peran: 'Pegawai',
        status: 'aktif',
      });
      toast('Akun pegawai ditambahkan.');
    } else {
      const u = AK(id);
      u.nama = o.nama.trim();
      u.username = uname;
      if (o.password) u.hash = await sha(o.password);
      toast('Akun pegawai diperbarui.');
    }
    save();
    aked = '';
    fv = {};
    errs = [];
    render();
  } else if (f === 'prod') {
    const id = e.target.dataset.id,
      x = [],
      h = parseInt(o.harga, 10),
      q = parseInt(o.kuota, 10);
    fv = { prod: o };
    if (String(o.nama).trim().length < 2) x.push('Nama produk wajib diisi.');
    if (!(h >= 0)) x.push('Harga tidak valid.');
    if (
      !o.buka ||
      !o.tutup ||
      !o.ambil ||
      !o.jb ||
      !o.jt ||
      !o.jm ||
      !o.js ||
      o.tutup + o.jt <= o.buka + o.jb ||
      o.ambil + o.jm < o.tutup + o.jt
    )
      x.push('Tanggal dan jam harus berurutan: buka, tutup, lalu pengambilan.');
    else if (hm(o.js) - hm(o.jm) < 60)
      x.push('Jam pengambilan minimal 1 jam (jam selesai harus setelah jam mulai).');
    if (!(q >= 1)) x.push('Kuota minimal 1.');
    if (o.foto && !/^https:\/\/\S+$/i.test(o.foto.trim()))
      x.push('URL foto harus diawali https:// dan tanpa spasi.');
    const old = id !== 'baru' ? RP(id) : null;
    if (old && q < used(old))
      x.push(`Kuota tidak boleh kurang dari pesanan yang sudah masuk (${used(old)}).`);
    if (x.length) {
      errs = x;
      render();
      return;
    }
    if (id === 'baru') {
      const pid = 'P' + ++db.n.p;
      db.produk.push({
        id: pid,
        nama: o.nama.trim(),
        deskripsi: o.deskripsi.trim(),
        harga: h,
        kat: o.kat,
        gam: o.gam,
        foto: (o.foto || '').trim(),
      });
      db.periode.push({
        id: 'R' + ++db.n.r,
        produkId: pid,
        buka: o.buka,
        tutup: o.tutup,
        ambil: o.ambil,
        kuota: q,
        jb: o.jb,
        jt: o.jt,
        jm: o.jm,
        js: o.js,
      });
    } else {
      const p = P(id),
        was = sisa(old),
        oa = old.ambil,
        ot = TJ(old);
      p.nama = o.nama.trim();
      p.deskripsi = o.deskripsi.trim();
      p.harga = h;
      p.kat = o.kat;
      p.gam = o.gam;
      p.foto = (o.foto || '').trim();
      Object.assign(old, {
        buka: o.buka,
        tutup: o.tutup,
        ambil: o.ambil,
        kuota: q,
        jb: o.jb,
        jt: o.jt,
        jm: o.jm,
        js: o.js,
      });
      if (was <= 0 && sisa(old) > 0) {
        // Scenario #4 langkah 8a/8a-1 di SRS: proses daftar tunggu DULU (FR-34–37),
        // baru kirim notifikasi "beritahu saya" (FR-22) untuk yang belum tercakup di daftar tunggu.
        prosesRestock(old); // FR-34, FR-35, FR-36, FR-37 (extend: Memproses Daftar Tunggu Saat Restock)
        db.minta
          .filter((m) => m.periodeId === old.id)
          .forEach((m) =>
            notify(
              m.kontak,
              'kuota',
              `Kuota ${p.nama} tersedia kembali. Pesan sekarang: ${link()}`,
            ),
          );
        db.minta = db.minta.filter((m) => m.periodeId !== old.id);
      }
      const nt = TJ(old);
      if (oa !== old.ambil || ot.jm !== nt.jm || ot.js !== nt.js)
        db.pesanan
          .filter((y) => y.periodeId === old.id)
          .forEach((y) => {
            y.jadwal = old.ambil;
            if (!SL(old).includes(y.slot)) y.slot = SL(old)[0];
            notify(
              y.kontak,
              'jadwal',
              `Jadwal pengambilan pesanan ${y.kode} berubah menjadi ${fmt(old.ambil)}${sx(y)}.`,
            );
          });
    }
    save();
    edit = '';
    fv = {};
    errs = [];
    toast('Produk tersimpan.');
    render();
  }
});
// ============================================================
// Jam, hitung mundur, dan menjalankan aplikasi
// ============================================================
setInterval(() => {
  const e = document.getElementById('ck');
  if (e) e.textContent = nowStr();
  document.querySelectorAll('[data-cd]').forEach((x) => {
    const r = R(x.dataset.cd);
    if (r) x.textContent = cdn(r);
  });
}, 20000);
window.addEventListener('hashchange', () => {
  stErr = '';
  errs = [];
  render();
});
render();