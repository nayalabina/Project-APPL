/*
 * views.js
 * Tampilan tiap halaman (pembuat HTML): Produk, Pesan, Status, Masuk, dan Admin.
 * Dimuat lewat <script> biasa (bukan module), berurutan: utils.js, data.js, views.js, app.js.
 * Semua file berbagi satu ruang nama global yang sama.
 */

const chip = (r) => {
  const s = st(r);
  return /* HTML */ `<span class="ch ${s === 'Tersedia' ? 'ok' : s === 'Habis' ? 'er' : ''}"
    >${s}</span
  >`;
};
const al = (m, c = '') => (m ? /* HTML */ `<div class="al ${c}" role="alert">${m}</div>` : '');
// ============================================================
// Halaman Produk
// ============================================================
function vProduk() {
  const L = db.periode.filter(
    (r) => (!kf || P(r.produkId).kat === kf) && (!ts || st(r) === 'Tersedia'),
  );
  return (
    /* HTML */ `<section class="hero"><span class="kk">Dipanggang segar · Pre-order</span><h1>Pre-order roti segar</h1><p class="mu">Lihat produk, sisa kuota, dan jadwal pre-order. Pelanggan tidak perlu login.</p></section><div class="fl" role="group" aria-label="Filter menu">${['', ...KAT].map((k) => /* HTML */ `<button type="button" class="chp${kf === k ? ' on' : ''}" data-a="kat" data-id="${k}" aria-pressed="${kf === k}">${k || 'Semua'}</button>`).join('')}<button type="button" class="chp${ts ? ' on' : ''}" data-a="ts" aria-pressed="${ts}">Tersedia saja</button></div><div class="mu" style="margin-top:12px">Menampilkan ${L.length} dari ${db.periode.length} menu</div><div class="g">` +
    (L.map((r, i) => {
      const p = P(r.produkId),
        s = sisa(r),
        k = st(r),
        t = TJ(r);
      const act =
        k === 'Tersedia'
          ? /* HTML */ `<button class="b" data-a="pesan" data-id="${r.id}">Pesan</button>`
          : k === 'Habis'
            ? /* HTML */ `<button class="b o" data-a="mt" data-k="minta" data-id="${r.id}">
                  Beritahu saya</button
                ><button class="b o" data-a="mt" data-k="tunggu" data-id="${r.id}">
                  Daftar tunggu
                </button>`
            : '';
      return /* HTML */ `<article class="c f">
        <div class="th t${i % 6}" aria-hidden="true">
          <svg viewBox="0 0 120 90"><use href="${gu(p)}" /></svg
          >${p.foto ? /* HTML */ `<img src="${esc(p.foto)}" alt="" loading="lazy" onerror="this.remove()" />` : ''}<span
            class="kt"
            >${esc(p.kat || 'Menu')}</span
          >
        </div>
        <div class="r sp"><strong>${esc(p.nama)}</strong>${chip(r)}</div>
        <div class="mu">${esc(p.deskripsi)}</div>
        <div><strong>${rp(p.harga)}</strong></div>
        <div class="bar" aria-hidden="true">
          <i style="width:${(Math.max(0, s) / r.kuota) * 100}%"></i>
        </div>
        <div class="mu">Sisa kuota ${s} dari ${r.kuota}</div>
        <div class="mu">
          Pre-order: ${fmt(r.buka)}, ${t.jb} – ${fmt(r.tutup)}, ${t.jt} WIB<br />Pengambilan:
          ${fmt(r.ambil)}, ${t.jm}–${t.js} WIB
        </div>
        ${k === 'Tersedia' ? /* HTML */ `<div class="cd">Tutup dalam <b data-cd="${r.id}">${cdn(r)}</b></div>` : ''}
        <div class="r">${act}</div>
      </article>`;
    }).join('') || '<div class="c">Tidak ada menu yang cocok dengan filter.</div>') +
    `</div>`
  );
}
// ============================================================
// Halaman Pesan
// ============================================================
function vPesan() {
  if (conf) {
    const o = db.pesanan.find((x) => x.kode === conf),
      p = P(R(o.periodeId).produkId);
    return /* HTML */ `<h1>Pesanan berhasil</h1>
      <div class="c f fm">
        <div class="r sp">
          <div>
            <div class="mu">Nomor antrean</div>
            <div class="big">${o.antrean}</div>
          </div>
          <span class="ch ok">${o.kode}</span>
        </div>
        <div>${esc(p.nama)} × ${o.jumlah} · ${rp(o.total)}</div>
        <div class="mu">
          Dipesan: ${wk(o.tgl)}<br />Pengambilan: ${fmt(o.jadwal)}${sx(o)}<br />Simpan kode pesanan
          untuk memantau status.
        </div>
        <div class="ms">Konfirmasi otomatis dikirim ke ${esc(o.kontak)} (simulasi).</div>
        <div class="r">
          <a
            class="b"
            style="text-decoration:none;display:inline-flex;align-items:center"
            href="#status"
            >Pantau status</a
          ><button class="b o" data-a="lagi">Pesan lagi</button>
        </div>
      </div>`;
  }
  const av = db.periode.filter((r) => st(r) === 'Tersedia'),
    cur = R(fv.periode || sel) || av[0],
    qr = qf ? R(qf) : null;
  return (
    /* HTML */ `<h1>Form pemesanan</h1><p class="mu">Isi data berikut. Jumlah tidak boleh melebihi sisa kuota.</p>` +
    (av.length
      ? /* HTML */ `<form class="c f fm" data-f="pesan" novalidate>
          ${errs.length ? al(errs.join('<br>')) : ''}${qr ? /* HTML */ `<div class="r"><button type="button" class="b o" data-a="mt" data-k="minta" data-id="${qr.id}">Beritahu saya</button><button type="button" class="b o" data-a="mt" data-k="tunggu" data-id="${qr.id}">Daftar tunggu</button></div>` : ''}
          <label
            >Produk<select name="periode" id="sp">
              ${db.periode.map((r) => /* HTML */ `<option value="${r.id}" ${st(r) !== 'Tersedia' ? 'disabled' : ''} ${cur && r.id === cur.id ? 'selected' : ''}>${esc(P(r.produkId).nama)} (${st(r)}, sisa ${sisa(r)})</option>`).join('')}
            </select></label
          >
          <label
            >Jumlah<input
              name="jumlah"
              type="number"
              min="1"
              max="99"
              value="${esc(fv.jumlah || 1)}"
          /></label>
          <div class="mu" id="jd">
            Jadwal pengambilan:
            ${cur ? fmt(cur.ambil) + ', ' + TJ(cur).jm + '–' + TJ(cur).js + ' WIB' : '-'}
          </div>
          <label
            >Jam pengambilan<select name="slot" id="sl">
              ${slotOpts(cur, fv.slot)}
            </select></label
          >
          <label>Nama<input name="nama" autocomplete="name" value="${esc(fv.nama || '')}" /></label
          ><label
            >Nomor kontak<input
              name="kontak"
              inputmode="tel"
              autocomplete="tel"
              value="${esc(fv.kontak || '')}"
          /></label>
          <button class="b" type="submit">Kirim pesanan</button>
        </form>`
      : /* HTML */ `<div class="c">Belum ada produk yang tersedia untuk dipesan.</div>`)
  );
}
// ============================================================
// Halaman Status
// ============================================================
function vStatus() {
  let r =
    stRes && stRes.length > 1
      ? /* HTML */ `<div class="mu" style="margin-top:14px">
          Ditemukan ${stRes.length} pesanan dengan nomor antrean tersebut.
        </div>`
      : '';
  (stRes || []).forEach((o) => {
    const rr = R(o.periodeId),
      p = P(rr.produkId),
      i = STAT.indexOf(o.status);
    r +=
      /* HTML */ `<div class="c f fm" style="margin-top:14px"><div class="r sp"><div><div class="mu">Nomor antrean</div><div class="big">${o.antrean}</div></div><span class="ch ok">${o.kode}</span></div><div>${esc(p.nama)} × ${o.jumlah}</div><div class="mu">Jadwal pengambilan: ${fmt(o.jadwal)}${sx(o)}</div><div class="mu">Dipesan: ${wk(o.tgl)}</div><div class="r sp"><span class="ch s${i}">${o.status}</span><span class="mu">Diperbarui ${wk(rw(o).slice(-1)[0].t)}</span></div><div class="bar" aria-hidden="true"><i style="width:${Math.max(8, (i / (STAT.length - 1)) * 100)}%"></i></div><ol class="tl2">${STAT.map(
        (s, j) => {
          const e = rw(o)
            .filter((x) => x.s === s)
            .pop();
          return /* HTML */ `<li
            class="${j < i ? 'd' : j === i ? 'n' : ''}"
            ${j === i ? ' aria-current="step"' : ''}
          >
            <span class="dt"
              >${j <= i ? '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check"/></svg>' : ''}</span
            >
            <div>
              <strong>${s}</strong>
              <div class="mu">${DS[j]}</div>
            </div>
            <time class="tm"
              >${j <= i ? (e ? /* HTML */ `<b>${jam(e.t)} WIB</b><span>${tgs(e.t)}</span>` : '<span>–</span>') : '<span>Menunggu</span>'}</time
            >
          </li>`;
        },
      ).join('')}</ol>` +
      db.notif
        .filter((n) => n.kepada === o.kontak && n.isi.includes(o.kode))
        .map(
          (n) =>
            /* HTML */ `<div class="ms">
              <span class="mu">${wk(n.waktu)}</span><br />${esc(n.isi)}
            </div>`,
        )
        .join('') +
      `</div>`;
  });
  return /* HTML */ `<h1>Status pesanan</h1>
    <p class="mu">
      Masukkan kode pesanan atau nomor antrean, beserta nomor kontak yang dipakai saat memesan.
    </p>
    <form class="c f fm" data-f="status" novalidate>
      ${al(stErr)}<label
        >Kode pesanan atau nomor antrean<input
          name="kode"
          placeholder="PO-0001 atau 2"
          value="${esc(qf && (qf.startsWith('PO') || /^\d+$/.test(qf)) ? qf : '')}" /></label
      ><label>Nomor kontak<input name="kontak" inputmode="tel" /></label
      ><button class="b" type="submit">Cari pesanan</button>
    </form>
    ${r}`;
}
// ============================================================
// Halaman Masuk staf
// ============================================================
function vMasuk() {
  return /* HTML */ `<section class="lg">
    <aside class="lv" aria-hidden="true">
      <i class="cir c1"></i><i class="cir c2"></i><i class="cir c3"></i
      ><svg class="hb" viewBox="0 0 120 90"><use href="#i-loaf" /></svg>
      <div class="fc fc1">
        <span class="mu">Roti Sobek Cokelat</span><strong>Sisa 12 dari 20</strong>
        <div class="bar"><i style="width:60%"></i></div>
      </div>
      <div class="fc fc2">
        <span class="ch ok">Siap diambil</span><span>PO-0042 · Antrean 3</span>
      </div>
      <div class="tg">Pre-order rapi,<br />antrean jelas.</div>
    </aside>
    <div class="lp">
      <a class="bk" href="#produk">← Kembali ke toko</a>
      <div class="lo" aria-hidden="true">
        <svg viewBox="0 0 120 90"><use href="#i-loaf" /></svg>
      </div>
      <h1>Selamat datang kembali</h1>
      <p class="mu">Masuk untuk mengelola pesanan, kuota, dan jadwal pengambilan.</p>
      <form class="f" data-f="login" novalidate>
        ${al(stErr)}<label
          >Username<span class="in"
            ><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-user" /></svg
            ><input
              name="u"
              autocomplete="username"
              placeholder="Masukkan username"
              value="${esc(fv.lu || '')}" /></span></label
        ><label
          >Kata sandi<span class="in"
            ><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-lock" /></svg
            ><input
              name="p"
              id="pw"
              type="password"
              autocomplete="current-password"
              placeholder="Masukkan kata sandi" /><button
              type="button"
              class="eye"
              data-a="pw"
              aria-pressed="false"
              aria-label="Tampilkan kata sandi"
            >
              <svg class="ic" viewBox="0 0 24 24" aria-hidden="true">
                <use href="#i-eye" />
              </svg></button></span></label
        ><button class="b sb" type="submit">Masuk</button>
      </form>
      <div class="dm">
        <span class="mu">Akun demo, ketuk untuk mengisi otomatis:</span>
        <div class="r">
          <button type="button" class="chp" data-a="demo" data-id="admin">admin</button
          ><button type="button" class="chp" data-a="demo" data-id="pegawai">pegawai</button>
        </div>
      </div>
    </div>
  </section>`;
}
// ============================================================
// Halaman Admin
// ============================================================
function vAdmin(s) {
  const adm = s.peran === 'Admin';
  if (!adm) tab = 'pesanan';
  // UI-07/UI-08: Admin mendapat 4 tab (termasuk Akun pegawai, FR-29/30); Pegawai hanya tab Pesanan.
  const tabs = /* HTML */ `<div class="r" role="tablist">
    ${(adm
      ? [
          ['pesanan', 'Pesanan'],
          ['produk', 'Produk dan kuota'],
          ['log', 'Daftar tunggu dan notifikasi'],
          ['akun', 'Akun pegawai'],
        ]
      : [['pesanan', 'Pesanan']]
    )
      .map(
        ([k, l]) =>
          /* HTML */ `<button class="b ${tab === k ? '' : 'o'}" data-a="tab" data-id="${k}">
            ${l}
          </button>`,
      )
      .join('')}<span class="mu" style="margin-left:auto"
      >${esc(s.nama || s.u)} (${s.peran}) · sesi berakhir setelah 30 menit tidak aktif</span
    ><button class="b o" data-a="keluar">Keluar</button>
  </div>`;
  let b = '';
  if (tab === 'pesanan')
    b = /* HTML */ `<h2>Pesanan</h2>
      <div class="tw c">
        <table>
          <tr>
            <th>Kode</th>
            <th>Pelanggan</th>
            <th>Produk</th>
            <th>Antrean</th>
            <th>Pengambilan</th>
            <th>Status</th>
            <th></th>
          </tr>
          ${db.pesanan
            .slice()
            .reverse()
            .map(
              (o) =>
                /* HTML */ `<tr>
                  <td><strong>${o.kode}</strong><br /><span class="mu">${wk(o.tgl)}${o.otomatis ? ' · otomatis' : ''}</span></td>
                  <td>${esc(o.nama)}<br /><span class="mu">${esc(o.kontak)}</span></td>
                  <td>${esc(P(R(o.periodeId).produkId).nama)} × ${o.jumlah}</td>
                  <td>${o.antrean}</td>
                  <td>
                    ${fmt(o.jadwal)}<br /><span class="mu">${o.slot ? o.slot + ' WIB' : '–'}</span>
                  </td>
                  <td>
                    <select data-k="${o.kode}" aria-label="Status ${o.kode}">
                      ${STAT.map((x) => /* HTML */ `<option ${x === o.status ? 'selected' : ''}>${x}</option>`).join('')}
                    </select>
                    <div class="mu" style="margin-top:4px">
                      Diperbarui ${jam(rw(o).slice(-1)[0].t)} WIB
                    </div>
                  </td>
                  <td><button class="b o" data-a="ss" data-id="${o.kode}">Simpan</button></td>
                </tr>`,
            )
            .join('')}
        </table>
      </div>`;
  if (tab === 'produk') {
    const e = edit && edit !== 'baru' ? P(edit) : null,
      er = e ? RP(e.id) : null,
      v =
        fv.prod ||
        (e
          ? {
              nama: e.nama,
              deskripsi: e.deskripsi,
              harga: e.harga,
              kat: e.kat || 'Manis',
              gam: e.gam || 'sobek',
              foto: e.foto || '',
              buka: er.buka,
              tutup: er.tutup,
              ambil: er.ambil,
              kuota: er.kuota,
              ...TJ(er),
            }
          : {
              nama: '',
              deskripsi: '',
              harga: '',
              kat: 'Manis',
              gam: 'sobek',
              foto: '',
              buka: day(0),
              tutup: day(5),
              ambil: day(7),
              kuota: '',
              jb: '08:00',
              jt: '17:00',
              jm: '09:00',
              js: '15:00',
            });
    b =
      /* HTML */ `<div class="r sp"><h2>Produk dan kuota</h2><button class="b" data-a="edit" data-id="baru">Tambah produk</button></div>` +
      (edit
        ? /* HTML */ `<form class="c f fm" data-f="prod" data-id="${edit}" novalidate>
            <strong>${e ? 'Ubah produk' : 'Produk baru'}</strong>${al(errs.join('<br>'))}<label
              >Nama produk<input name="nama" value="${esc(v.nama)}" /></label
            ><label>Deskripsi<input name="deskripsi" value="${esc(v.deskripsi)}" /></label
            ><label
              >Harga (Rp)<input name="harga" type="number" min="0" value="${esc(v.harga)}"
            /></label>
            <div class="g2">
              <label
                >Kategori<select name="kat">
                  ${KAT.map((x) => /* HTML */ `<option ${x === v.kat ? 'selected' : ''}>${x}</option>`).join('')}
                </select></label
              ><label
                >Ilustrasi<select name="gam">
                  ${GM.map((x) => /* HTML */ `<option value="${x}" ${x === v.gam ? 'selected' : ''}>${GN[x]}</option>`).join('')}
                </select></label
              >
            </div>
            <label
              >URL foto (opsional, https)<input
                name="foto"
                inputmode="url"
                placeholder="https://…"
                value="${esc(v.foto)}"
            /></label>
            <div class="g2">
              <label>Buka pre-order<input name="buka" type="date" value="${v.buka}" /></label
              ><label>Jam buka<input name="jb" type="time" value="${v.jb}" /></label>
            </div>
            <div class="g2">
              <label>Tutup pre-order<input name="tutup" type="date" value="${v.tutup}" /></label
              ><label>Jam tutup<input name="jt" type="time" value="${v.jt}" /></label>
            </div>
            <label>Tanggal pengambilan<input name="ambil" type="date" value="${v.ambil}" /></label>
            <div class="g2">
              <label>Jam mulai pengambilan<input name="jm" type="time" value="${v.jm}" /></label
              ><label>Jam selesai pengambilan<input name="js" type="time" value="${v.js}" /></label>
            </div>
            <label>Kuota<input name="kuota" type="number" min="1" value="${esc(v.kuota)}" /></label>
            <div class="r">
              <button class="b" type="submit">Simpan</button
              ><button type="button" class="b o" data-a="batal">Batal</button>
            </div>
          </form>`
        : '') +
      /* HTML */ `<div class="tw c">
        <table>
          <tr>
            <th>Produk</th>
            <th>Harga</th>
            <th>Periode</th>
            <th>Pengambilan</th>
            <th>Kuota</th>
            <th>Sisa</th>
            <th></th>
          </tr>
          ${db.produk
            .map((p) => {
              const r = RP(p.id);
              return /* HTML */ `<tr>
                <td>
                  <strong>${esc(p.nama)}</strong><br /><span class="mu">${esc(p.kat || '–')}</span>
                </td>
                <td>${rp(p.harga)}</td>
                <td>${fmt(r.buka)}, ${TJ(r).jb}<br />${fmt(r.tutup)}, ${TJ(r).jt}</td>
                <td>${fmt(r.ambil)}<br /><span class="mu">${TJ(r).jm}–${TJ(r).js} WIB</span></td>
                <td>${r.kuota}</td>
                <td>${sisa(r)}</td>
                <td style="white-space:nowrap">
                  <button class="lk" data-a="edit" data-id="${p.id}">Ubah</button
                  ><button class="lk" style="color:var(--er)" data-a="hapus" data-id="${p.id}">
                    Hapus
                  </button>
                </td>
              </tr>`;
            })
            .join('')}
        </table>
      </div>`;
  }
  if (tab === 'log')
    b = /* HTML */ `<h2>Daftar tunggu</h2>
      <div class="tw c">
        <table>
          <tr>
            <th>Posisi</th>
            <th>Produk</th>
            <th>Nama</th>
            <th>Kontak</th>
            <th>Jumlah</th>
            <th>Waktu daftar</th>
          </tr>
          ${
            db.tunggu
              .map(
                (t) =>
                  /* HTML */ `<tr>
                    <td>${posisiTunggu(t)}</td>
                    <td>${esc(P(R(t.periodeId).produkId).nama)}</td>
                    <td>${esc(t.nama)}</td>
                    <td>${esc(t.kontak)}</td>
                    <td>${t.jumlah}</td>
                    <td>${t.waktu ? wk(t.waktu) : '–'}</td>
                  </tr>`,
              )
              .join('') || '<tr><td colspan="6" class="mu">Belum ada.</td></tr>'
          }
        </table>
      </div>
      <h2>Permintaan pemberitahuan kuota</h2>
      <div class="tw c">
        <table>
          <tr>
            <th>Produk</th>
            <th>Nama</th>
            <th>Kontak</th>
            <th>Waktu minta</th>
          </tr>
          ${
            db.minta
              .map(
                (t) =>
                  /* HTML */ `<tr>
                    <td>${esc(P(R(t.periodeId).produkId).nama)}</td>
                    <td>${esc(t.nama)}</td>
                    <td>${esc(t.kontak)}</td>
                    <td>${t.waktu ? wk(t.waktu) : '–'}</td>
                  </tr>`,
              )
              .join('') || '<tr><td colspan="4" class="mu">Belum ada.</td></tr>'
          }
        </table>
      </div>
      <h2>Notifikasi terkirim (simulasi)</h2>
      <div class="c">
        ${db.notif.map((n) => /* HTML */ `<div class="ms"><strong>${wk(n.waktu)}</strong> ke ${esc(n.kepada)}<br />${esc(n.isi)}</div>`).join('') || '<span class="mu">Belum ada.</span>'}
      </div>`;
  if (tab === 'akun') {
    // FR-29/30, UC-15: tab Akun pegawai — hanya muncul untuk Admin (lihat definisi `tabs` di atas)
    const e = aked && aked !== 'baru' ? AK(aked) : null,
      v = fv.akun || (e ? { nama: e.nama, username: e.username, password: '' } : { nama: '', username: '', password: '' });
    b =
      /* HTML */ `<div class="r sp"><h2>Akun pegawai</h2><button class="b" data-a="akunedit" data-id="baru">Tambah pegawai</button></div>` +
      (aked
        ? /* HTML */ `<form class="c f fm" data-f="akun" data-id="${aked}" novalidate>
            <strong>${e ? 'Ubah akun pegawai' : 'Akun pegawai baru'}</strong>${al(errs.join('<br>'))}<label
              >Nama<input name="nama" value="${esc(v.nama)}" /></label
            ><label>Username<input name="username" value="${esc(v.username)}" /></label
            ><label
              >Kata sandi${e ? ' (kosongkan jika tidak diganti)' : ''}<input
                name="password"
                type="password"
                autocomplete="new-password"
            /></label>
            <div class="r">
              <button class="b" type="submit">Simpan</button
              ><button type="button" class="b o" data-a="akunbatal">Batal</button>
            </div>
          </form>`
        : '') +
      /* HTML */ `<div class="tw c">
        <table>
          <tr>
            <th>Nama</th>
            <th>Username</th>
            <th>Peran</th>
            <th>Status</th>
            <th></th>
          </tr>
          ${db.pengguna
            .map(
              (u) => /* HTML */ `<tr>
                <td>${esc(u.nama)}</td>
                <td>${esc(u.username)}</td>
                <td>${u.peran}</td>
                <td><span class="ch ${u.status === 'aktif' ? 'ok' : 'er'}">${u.status}</span></td>
                <td style="white-space:nowrap">
                  ${u.peran === 'Pegawai'
                    ? /* HTML */ `<button class="lk" data-a="akunedit" data-id="${u.username}">Ubah</button
                      ><button class="lk" style="color:var(--er)" data-a="akunstatus" data-id="${u.username}">
                        ${u.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>`
                    : '<span class="mu">Akun admin</span>'}
                </td>
              </tr>`,
            )
            .join('')}
        </table>
      </div>`;
  }
  return /* HTML */ `<div class="r sp">
      <h1>Pengelolaan</h1>
      <span class="clk" id="ck">${nowStr()}</span>
    </div>
    ${tabs}${b}`;
}