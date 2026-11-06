# Hacim Akışı kas grupları — geliştirme durumu

Durum: Geliştirme dalında hazır; canlıya alınmadı. Yayın için kullanıcının açık onayı gerekir.
Dal: `dev/home-flow-muscle-groups`
Başlangıç: `4e8169e4a578194db52ee7881be1d554b5681b0c`

## Değişiklikler

- `app.js`: Özet hareketlerine kayıtlı birincil kas bilgisi taşındı. Ana Sayfa grupları GÖĞÜS, SIRT, OMUZ, KOL, BACAK, KARIN sırasıyla ve yalnızca veri varsa gösterilir. Ön kol/arka kol KOL altında birleştirilir. Grup içinde hacim azalan sıralıdır. Grup toplamı ve genel hacim üzerinden yüzde hesaplanır. Her hareket yalnızca bir gruptadır.
- Hareket kartı HTML'i, ikon boyutu, renk ataması, hacim/maksimum hesapları, şerit kalınlığı, gradient ve kavis fonksiyonları korunmuştur. Başlıklar aynı düz grid içinde bulunur: mevcut offsetTop tabanlı çizim başlık boşluklarını otomatik hesaba katar; başlıklara çizgi bağlanmaz. Detay/vurgulama indeksleri yeni sıralamayı kullanır.
- `style.css`: Etkileşimsiz, pastel, tema değişkenlerine uyumlu başlıklar; grup aralarında 11px ek boşluk, grup içindeki mevcut 7px boşluk korunur. Dar başlıklar gerektiğinde satır kırar.
- Son antrenman, geçmiş seçimi, hafta/ay/tüm geçmiş korunur. Günlük antrenman özeti gruplandırılmadı.
- Bilinmeyen özel kas etiketleri varsa hareket/hacim kaybolmasın diye en sonda DİĞER gösterilir. Bilinen altı grup dışında bu koruma yalnızca eşleşmeyen kayıtlar için devreye girer. Aynı adlı hareketin birincil etiketi geçmişte değiştirilmişse mevcut birleştirme mantığında ilk katkı veren kaydın etiketi kullanılır.
- Veritabanı, Supabase, kayıt yazma/silme, kimlik doğrulama, servis çalışanı ve yayın ayarları değiştirilmedi.

## Doğrulama

Geçti:
- `node --check app.js` ve `git diff --check`
- `node tests/home-flow-groups.cjs`: sabit sıra, grup içi sıra, grup toplamları, yüzde paydası, çift dambıl, vücut ağırlığı/0 hacim, boş durum, özel etiket, tekrar saymama, detay indeksleri, tüm tarih seçenekleri, kayıtların değişmemesi.
- `node tests/home-insights.cjs`: son antrenman/geçmiş/filtreler ve mevcut ana sayfa davranışları.
- `node tests/summary-flow.cjs`: başlık boşluklarıyla kart koordinatları, 320/390/768 genişlik geometrisi, şeritler, gradient, vurgulama, detay, günlük özet ve veri korunması. Bu bir DOM taklidi testidir; gerçek tarayıcı testi değildir.
- `node tests/pwa-dock-unit.cjs`: mevcut iOS standalone, klavye, yön değişimi ve alt menü birim testleri.

Başlangıç dalında da aynı şekilde başarısız (bu değişiklikten kaynaklanmıyor):
- `tests/member-directory.cjs`: test DOM nesnesinde querySelectorAll eksik.
- `tests/audit.cjs`: test DOM nesnesinde classList.remove eksik.
- `tests/beginner-program.cjs`: test ortamında requestAnimationFrame eksik.
- `tests/growth.cjs`: önceden kaldırılmış Gelişim sekmesini bekleyen eski assertion.
Bu sonuçlar değişmemiş başlangıç commit'inin ayrı worktree'sinde karşılaştırıldı. Kapsam dışı testler değiştirilmedi.

## Tamamlanmayan doğrulama ve sonraki adımlar

- `tests/home-flow-layout.cjs` 320/375/393/430px, açık/koyu temalar, standalone bayrağı, uzun isimler, yatay taşma, ikon çakışması, 7px boşluk ve gerçek SVG uç noktası kontrolleri için hazırlandı; çalıştırılamadı.
- Chromium ortamın socket kısıtlaması nedeniyle başlayamadı. WebKit indirildi ancak gerekli sistem kütüphaneleri eksik. Bu nedenle görsel testler geçti denilemez.
- Uygun Playwright ortamında `FLOW_BROWSER=webkit node tests/home-flow-layout.cjs` ve `node tests/pwa-dock.cjs` çalıştırılmalı. Chromium için CHROMIUM_PATH kullanılabilir. Standalone bayrağı simülasyonu gerçek iOS kurulumunun yerine geçmez.
- Gerçek iPhone Safari ve ana ekrana eklenmiş PWA'da açık/koyu tema, uzun hareket adı, filtre değişimi, yön değişimi kontrol edilmeli. Hazırlanan testler izole örnek veriler kullanır; canlı hesap verilerini okumaz/yazmaz.
- Kullanıcı onayına kadar main'e birleştirme/yayın yapılmamalı. Onaydan önce eksik görsel kontroller tamamlanmalı.

Devam ederken bu dosya ve dal farkı okunmalı; tamamlanan hesaplama testleri gereksiz yere yeniden yazılmamalı.
