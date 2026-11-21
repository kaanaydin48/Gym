# Instagram Minimal V3

Çalışma dalı `feature/instagram-minimal-v3`, uygulama commit’i `1a668c3`, PR #26. Temel alınan ana dal `b6c8c50`. Önceki V3 dalındaki dört commit korundu. Ana dalda Classic White ve Liquid Glass V1.5 doğrulandı. Aurora Glass, Gym Social V1 ve Minimal V2, incelenen tema kayıtlarında yer almıyordu.

| Ekran | Yerel test hesabı, 390 × 844 |
|---|---|
| Ana Sayfa | [Görsel](ana-sayfa.jpg) |
| Antrenman | [Görsel](antrenman.jpg) |
| Programlar | [Görsel](programlar.jpg) |
| Hesap | [Görsel](hesap.jpg) |

Instagram’ın [App Store tanıtımı](https://apps.apple.com/us/app/instagram/id389801252) ve [Meta’nın navigasyon duyurusu](https://about.fb.com/news/2025/09/in-india-instagram-debuts-a-reels-first-experience-for-its-mobile-app/) referans alındı. Akışın üstündeki dairesel seçimler, gönderi fotoğrafı, yatay profil sayaçları ve ince ayırıcılar uyarlandı. Üç sekme ve hızlı set girişi korundu. Güncel iPhone uygulamasının birebir ölçüleri ve kaydırma fiziği ölçülmedi.

Uygulama, mevcut JavaScript ekran üreticilerini ve kullanıcı hesabına bağlı tema tercihlerini kullanıyor. Antrenman geçmişi, program ve XP modelleri için migrasyon yok. Ana sayfadaki üç gönderi mevcut günlük içerik tüketimini, kaydetme, tepki ve paylaşma işlemlerini kullanır. Fotoğraflar Unsplash görsellerinin depoya alınmış kopyalarıdır (images.unsplash.com, photo-1534438327276-14e5300c3a48, photo-1517836357463-d25dfeac3438, photo-1518611012118-696072aa579a). Profilde doğrulanmış görev modeli geldiğinde XP gösterilir. Gün/hafta bilgisi kaynağında sağlanan programlarda gösterilir.

Yerel kontroller: npm test, günlük içerik motoru, hesap bazlı tema kalıcılığı ve temsili bulut eşitlemesi başarılı. Chromium'da 320, 390 ve 430 px genişlikte dört ekran, hikâye geçişi, geçmiş antrenman, program düzenleme/seçme, XP görünümü ve tema değiştirme doğrulandı. 320, 393 ve 430 px genişlikte set girdileri, otomatik süre, hareket değiştirme, süper set, çevrimdışı kayıt ve tekrar eşitleme başarılı. Üretim veritabanına test girdisi yazılmadı.

Fiziksel iPhone’da Safari ve ana ekrandan başlatılan PWA, gerçek bildirim teslimi ve iki gerçek cihaz arasında bulut eşitlemesi yerinde doğrulanmadı. Güncel CI ve dağıtım durumları PR #26 ve GitHub Actions üzerinden izlenebilir.
