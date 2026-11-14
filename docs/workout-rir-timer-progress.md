# Antrenman güncellemesi — 14 Kasım 2026

Durum: kullanıcı canlıya alma onayı verdi; yayın hazırlığı tamamlandı.
Dal: fix/workout-rir-timer-manual-sets

## Yapılanlar
- app.js: isteğe bağlı 0–10 RIR girişi ve eski değerlerin gösterimi; ilk tamamlandı tikinde süreyi bir kez başlatma; bitmiş kayıtların sürelerini koruma; akıllı doldurma menüsü ve yenileme kodunun kaldırılması; RIR içeren seti silerken veri uyarısı.
- workout-flex-v2.js: otomatik set kopyalama kaldırıldı; yeni setler boş; geçmiş kayıtlar korunur.
- style.css: beş sütunlu set girişi; canlı yeşil #22A653 ve artı/eksi #404040; tamamlanan tikin solmasını önleme.
- tests/workout-flex-v2/: RIR, otomatik başlatma, manuel giriş, geçmiş veri, çevrimdışı kayıt ve mobil test senaryoları güncellendi.

## Doğrulama
- npm test başarılı: 9 temel test grubu, 24 görev testi, 10 antrenman testi.
- JavaScript sözdizimi ve git diff --check başarılı.
- Mobil Chromium/WebKit testi bu ortamda tamamlanamadı: sistem Chromium soket açamıyor (Operation not permitted); Playwright tarayıcı indirmesi geçersiz arşiv döndü.
- Gerçek kullanıcı hesabına veya canlı veritabanına yazılmadı.

## Sonraki adımlar
1. GitHub CI üzerinde Chromium ve WebKit 320/393/430 px kontrollerini tamamla; gerekirse düzelt.
2. Kullanıcı canlıya alma onayı verdikten sonra main ile birleştir ve dağıtımı doğrula.
3. Yayın öncesi önbellek sürümünü güncel kaynaklara göre kontrol et.

## Yayın doğrulaması
- Önceki commit için GitHub CI üç iş akışında başarılı; Chromium ve WebKit mobil testleri geçti.
- index.html, auth-guard.js ve sw.js önbellek sürümleri workout-rir-20261114 / v18-rir-timer olarak güncellendi.
- Sonraki işlem: güncel CI sonuçlarını kontrol et, PR #21 birleştir, GitHub Pages dosyalarını doğrula.
