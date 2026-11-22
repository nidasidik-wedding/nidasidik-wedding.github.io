/* ============================================================
   KONFIGURASI - ubah bagian ini saja
   (nama, orang tua, alamat, jam acara: edit langsung di index.html)
   ============================================================ */
const CONFIG = {
  // Waktu akad untuk hitung mundur (format ISO, zona WIB).
  tanggalHitungMundur: "2027-01-05T08:30:00+07:00",

  // Link Google Maps lokasi acara (dibaca dari QR di undangan kertas).
  // Kosongkan ("") untuk menyembunyikan tombol.
  linkMaps: "https://maps.app.goo.gl/YgPqBcHJp7iMuLRy9",

  // Rekening untuk gift (hadiah) bagi tamu yang tidak bisa hadir.
  // Isi nomor dan nama pemilik. Selama nomor kosong, tampil "Nomor rekening menyusul".
  // Hapus satu baris jika tidak diperlukan, atau tambah baris baru untuk bank / e-wallet lain.
  gift: [
    { bank: "BRI",     nomor: "4389 0101 6533 536", atasNama: "Nida ankhoviyya" },
    { bank: "Mandiri", nomor: "1370013872268", atasNama: "Sidik Santoso" }
  ],

  // File musik (taruh di folder assets). Jika file tidak ada, tombol musik otomatis disembunyikan.
  musik: "assets/musik.mp3"
};

/* ============================================================
   Kode di bawah ini tidak perlu diubah
   ============================================================ */
(function () {
  const $ = (s) => document.querySelector(s);

  // --- Nama tamu dari link: ...index.html?to=Budi%20Santoso ---
  const tamu = new URLSearchParams(location.search).get("to");
  if (tamu) $("#tamu").textContent = tamu;

  // --- Tombol Google Maps ---
  if (CONFIG.linkMaps) {
    const m = $("#btn-maps");
    m.href = CONFIG.linkMaps;
    m.hidden = false;
  }

  // --- Hitung mundur ---
  (function hitungMundur() {
    const box = $("#hitung");
    const target = new Date(CONFIG.tanggalHitungMundur).getTime();
    if (!CONFIG.tanggalHitungMundur || isNaN(target)) { box.hidden = true; return; }
    let timer;
    const tick = () => {
      let d = target - Date.now();
      if (d <= 0) {
        box.innerHTML = '<div class="selesai">Alhamdulillah, hari bahagia telah tiba</div>';
        clearInterval(timer);
        return;
      }
      const hari = Math.floor(d / 864e5); d %= 864e5;
      const jam  = Math.floor(d / 36e5);  d %= 36e5;
      const mnt  = Math.floor(d / 6e4);   d %= 6e4;
      const dtk  = Math.floor(d / 1e3);
      box.innerHTML = [[hari, "Hari"], [jam, "Jam"], [mnt, "Menit"], [dtk, "Detik"]]
        .map(([n, l]) => `<div><b>${String(n).padStart(2, "0")}</b><small>${l}</small></div>`).join("");
    };
    tick();
    timer = setInterval(tick, 1000);
  })();

  // --- Gift ---
  (function gift() {
    const wadah = $("#daftar-gift");
    const salin = async (teks, tombol) => {
      try { await navigator.clipboard.writeText(teks); }
      catch (e) {
        const t = document.createElement("textarea");
        t.value = teks; t.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(t); t.select();
        try { document.execCommand("copy"); } catch (_) {}
        t.remove();
      }
      const asal = tombol.textContent;
      tombol.textContent = "Tersalin";
      setTimeout(() => (tombol.textContent = asal), 1800);
    };
    const el = (tag, cls, teks) => {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (teks) n.textContent = teks;
      return n;
    };
    (CONFIG.gift || []).forEach((g) => {
      const k = el("div", "gift-kartu");
      k.appendChild(el("p", "gift-bank", g.bank));
      if (g.nomor) {
        k.appendChild(el("p", "gift-nomor", g.nomor));
        if (g.atasNama) k.appendChild(el("p", "gift-nama", "a.n. " + g.atasNama));
        const b = el("button", "tombol", "Salin Nomor");
        b.type = "button";
        b.addEventListener("click", () => salin(g.nomor.replace(/\s+/g, ""), b));
        k.appendChild(b);
      } else {
        k.appendChild(el("p", "gift-nomor menyusul", "Nomor rekening menyusul"));
      }
      wadah.appendChild(k);
    });
    if (!wadah.children.length) wadah.closest(".gift").remove();
  })();

  // --- Foto mempelai kosong: tampilkan bingkai putus-putus jika file belum ada ---
  document.querySelectorAll("img[data-foto]").forEach((img) => {
    const tandai = () => { img.parentElement.classList.add("kosong"); img.remove(); };
    if (img.complete && img.naturalWidth === 0) tandai();
    else img.addEventListener("error", tandai, { once: true });
  });

  // --- Galeri: foto yang belum ada tampil sebagai bingkai kosong bertuliskan "Foto" ---
  document.querySelectorAll("img[data-galeri]").forEach((img) => {
    const tandai = () => { img.parentElement.classList.add("kosong"); img.remove(); };
    if (img.complete && img.naturalWidth === 0) tandai();
    else img.addEventListener("error", tandai, { once: true });
  });

  // --- Buka undangan + musik ---
  const audio = $("#musik");
  const btnMusik = $("#btn-musik");
  audio.src = CONFIG.musik;
  let bermain = false, musikAda = true;

  function setMusik(on) {
    if (on && musikAda) {
      audio.play()
        .then(() => { bermain = true; btnMusik.classList.add("main"); })
        .catch(() => { if (audio.error) { musikAda = false; btnMusik.hidden = true; } });
    } else {
      audio.pause(); bermain = false; btnMusik.classList.remove("main");
    }
  }
  audio.addEventListener("error", () => { musikAda = false; btnMusik.hidden = true; });

  $("#btn-buka").addEventListener("click", () => {
    $("#cover").classList.add("buka");
    document.body.classList.remove("locked");
    window.scrollTo(0, 0);
    if (musikAda) btnMusik.hidden = false;
    setMusik(true);
    setTimeout(() => ($("#cover").style.display = "none"), 1300);
    mulaiReveal();
  });
  btnMusik.addEventListener("click", () => setMusik(!bermain));

  // --- Animasi saat di-scroll: bagian mempelai (foto & teks berlawanan arah) dan teks lain ---
  function mulaiReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.25 });
    document.querySelectorAll("[data-reveal], .mempelai").forEach((el) => io.observe(el));
  }
})();
