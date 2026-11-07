# Kompakt Hacim Akışı — 7 Kasım 2026

Durum: kullanıcı 7 Kasım 2026 tarihinde açıkça canlı yayın onayı verdi. Yayın için hazırlandı; görsel tarayıcı/iPhone doğrulaması bekliyor.
Yayın hazırlığı: index.html, auth-guard.js ve sw.js dosyalarında yalnızca statik dosya/cache sürüm etiketleri compact-flow-20261107 / v14 olarak güncellendi.
Dal: design/compact-home-flow-2026-11-07

## Değişiklikler
- app.js: yalnızca Ana Sayfa kart işaretlemesi; mevcut ikon sol başta, ad ve Maks. ortada, hacim/yüzde sağda, ince çubuk altta.
- style.css: minimum yükseklik 78 → 51 px (gerçek yükseklik içeriğe göre büyür; 44 px ikon ve dolgular nedeniyle en az yaklaşık 52 px). Genişlik grafik alanının %74 → %59,2'si, yani %20 daralma. Sağ hizalı; dikey boşluk 6 px, ikon 55 → 44 px, köşe 12 px. Uzun adlar ve büyük değerler satıra sarılır, gizlenmez.
- Kas sırası son talebe göre GÖĞÜS, SIRT, OMUZ, BACAK, KOL, KARIN; renkler eski grup kimlikleriyle korunur. Mevcut DİĞER grubu bilinmeyen özel hareketleri kaybetmemek için korunur.
- Kavis fonksiyonları değişmedi: kart kolonunun offsetLeft ve kartın offsetTop/offsetHeight ölçüleriyle yeni konuma bağlanır. Renkler, geçişler ve kalınlık hesapları aynı.
- tests/home-flow-groups.cjs: yeni sıralama ve korunmuş grup renkleri.
- tests/home-flow-layout.cjs: 6 px boşluk, %59,2 genişlik, içerik taşması ve soldaki ikon için kontroller güncellendi.
- tests/build-home-flow-preview.cjs ve docs/compact-flow-preview.html: gerçek mevcut ikonları kullanan, yalnızca sentetik kayıt içeren çevrimdışı önizleme. Genişlik seçimi ve kart vurgulama çalışacak şekilde hazırlanmıştır; tarih/geçmiş kontrolleri önizlemede devre dışıdır.

## Doğrulama
- node --check app.js: geçti.
- node tests/run-unit.cjs: 9/9 paket geçti (simüle DOM/veri hizmeti testleri; canlı veri işlemi yapılmadı).
- Önizleme JavaScript sözdizimi ve git diff --check: geçti.
- Chromium mobil düzen testi: ortamın socket izni nedeniyle tarayıcı başlatılamadı; test geçmedi, çalıştırılamadı.
- WebKit testi: yürütülebilir tarayıcı kurulu değil; çalıştırılamadı.
- Ayrı tarayıcı yerel file URL'sini güvenlik politikası nedeniyle açmadı. Görsel kontrol ve ekran görüntüsü elde edilmedi.
- Gerçek iPhone Safari ve kurulu PWA testi yapılmadı; alt menüye dokunulmadı, görsel etkisizlik henüz cihazda doğrulanmadı.

## Mevcut davranış notu
Üretim sürümünde Bugün yerine daha önce onaylanan Son antrenman seçimi var. Son antrenman / Bu hafta / Bu ay / Tüm geçmiş davranışı korunmuştur. Hesaplama, kayıt, senkronizasyon, yetki, takvim, Supabase, servis çalışanı ve canlı yayın ayarları değiştirilmedi.

## Devam adımları
1. Bu dalı aç, mevcut değişiklikleri yeniden yapma.
2. NODE_PATH uygun Playwright kurulumunu gösterirken node tests/home-flow-layout.cjs çalıştır; WebKit için FLOW_BROWSER=webkit kullan.
3. docs/compact-flow-preview.html dosyasını tarayıcıda aç; 320, 375, 393, 430 ve 768 px genişliklerde uzun adlar/büyük değerler, ikonlar ve kavisleri görsel kontrol et. %35 yüksekliğin her isimde gerçekleşmesi beklenmez; okunabilirlik önceliklidir.
4. iPhone Safari ve kurulu PWA'da alt menü, yön değişimi ve tarih seçimlerini gerçek geliştirme ortamında doğrula; gerekirse yalnızca kart stillerini düzelt.
5. Kullanıcının açık yayın onayı olmadan main'e birleştirme, GitHub Pages veya Supabase'e yayın yapma.
