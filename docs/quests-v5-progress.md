# Gym Trader Pro — V5 otomasyon: geliştirme ve yayın öncesi rapor

15 Kasım 2026. Dal: `feature/v5-full-automation-20261115`.
Taban: `2656311471c2a09e9f65659cd0cbb9bff9b76735`.
**Üretime yayın yapılmadı. Ana dal değiştirilmedi. Canlı veya hosted test Supabase'e yazılmadı.**
Son commit: bu dosyanın bulunduğu dalda `git log -1`. İlerleme bu depoda saklanır.

## Uygulananlar

- Değerlendirme/kanıt formu, gönderme, manuel görev tamamlama, koç onay/red/manuel atama arayüzleri kaldırıldı. Koç ekranı salt okunur ilerleme gösterir.
- Eski cihaz başvuru kuyruğu artık çalıştırılmaz; cihazdaki kayıt silinmez. Sunucudaki eski kanıt, eylem, override, görev ve XP kayıtları tutulur.
- Günlük: geçerli antrenman bitirme 30; 8 set 20; 16 set 20 XP. İşaretlenmiş geçerli setler antrenman bitmeden sayılır. Bir günün antrenman ödülü bir kez verilir.
- Haftalık: Göğüs 4/50, Sırt 4/60, Omuz 3/50, Kol 5/40, Bacak 4/70, Karın 1/30. Ön/arka kol Kol'a eşlenir; bilinmeyen bölgeye tahmini XP verilmez. Hareketin kayıttaki birincil kası kullanılır.
- Planlı dinlenme 15 XP; gün bittikten sonra, gece yarısında bilinen plan ve güncel takvim hâlâ dinlenmeyse; haftada ilk üç uygun gün. Plan kaldırılırsa ödül geri alınır, sonraki uygun gün sınır içinde ödüllendirilebilir.
- Antrenman/set geçerliliği ortak workout-metrics kurallarını kullanır. Günlük 250 sınırı; haftalık ayrı havuz. V5'te ek PR/haftalık 4/4 bonusu yoktur. Günlük yeni standart ödüller toplamı 70 olduğundan 250 tavanı yapay ödül girdileriyle ayrıca test edildi.
- Seviye ve ilerleme XP toplamından; rozet ve unvanlar otomatik. Eski rozet/unvanlar migration sırasında saklanır. Dinlenme devamlılık serisine katılmaz; V5 seri altı kas hedefinin tamamlandığı ardışık kapalı haftalardır.
- Kişisel hedefler otomatik set/antrenman ölçütleriyle devam eder, ek XP üretmez. Eski manuel hedef kayıtları silinmez ama aktif V5 kartı oluşturmaz. 8/16 hedefleri sabittir; 28 günlük geçmişten hedef önerisi metadatası gelecekte kişiselleştirme için korunur, otomatik hedef değiştirme etkin değildir.
- Başarılı antrenman senkronizasyonu görev yenilemesini hemen tetikler. Eşzamanlı yenilemeler sıraya alınır. Mevcut revision tabanlı otomatik kayıt/çevrimdışı tekrar mekanizması kullanılır; istemci XP yazmaz.
- Kartlar sıkılaştırıldı; tamamlanan haftalık kartların tiki de yumuşak yeşildir. Günlük/Haftalık, Kişisel hedef, Rozetler ve Karşılaştırma korunur. Service worker önbellek sürümü artırıldı.

## XP geçişi ve önemli sınırlar

Eski XP defteri net toplamıyla korunur. V5 anahtarları `quest:v5:...`, görev yuvaları 11–17'dir; eski yuvalarla çakışmaz. Daha önce herhangi bir XP defter kaydı bulunan hesaplarda başlangıç bir sonraki İstanbul gece yarısıdır. Yeni/ödülsüz hesaplar aynı gün başlar. Geçiş günündeki eski kazanımlar dondurulur; henüz kazanılmamış V4 ödülleri sonradan verilmez. Arayüz V5 başlangıç tarihini açıklar.

V5 yalnız geçiş tarihi ve sonrası kaynakları ödüllendirir. Geçiş öncesi kayıtlar karşılaştırma/antrenman istatistiklerine katılır ama dondurulmuş V4 XP'yi yeniden hesaplamaz. Bu tercih eski kazanımı sıfırlamamak ve aynı antrenmanı V4+V5 ile çift ödüllendirmemek içindir. Geçiş sonrası geçmiş düzenlemeler ekleme/ters ledger kayıtlarıyla tam yeniden hesaplanır.

Yerel dönem `Europe/Istanbul` olarak sabittir; cihaz saat dilimi seyahatte farklı olsa da görevler Türkiye saatini kullanır. Gece yarısı scheduler ilk çalışmasında gün değişimini yakalar (mevcut cron yaklaşık dakika çözünürlüğünde); uygulama kapalıysa sonraki worker çalışması kaçırılan günleri tamamlar. Yeni bir hesabın gün ortasında eklediği dinlenme o gün için önceden planlanmış kabul edilmez.

## Supabase ve güvenlik

Üretim `aryzgrgjwjdxumbddank` salt okunur incelendi. Görev tablolarının RLS'si açık. `xp_ledger` authenticated rolüne yalnız SELECT verir. Sahip/atanmış koç okumaları ve private RPC sınırları mevcut altyapıdan korunur.

Migration `supabase/migrations/20261115103440_quests_v5_automation.sql`:
- Hesaplara geçiş tarihi/eski rozet-unvan snapshot'ı ekler, generation artırır.
- Eski görevleri tutarak yuva CHECK kısıtını genişletir.
- Manuel eylem/onay/atama/düzenleme public ve private RPC EXECUTE izinlerini kapatır.
- Eski worker'ın eski anahtarlarla XP yazmasını reddeden trigger ekler.
- Kişisel hedeflerde yalnız otomatik ölçütleri kabul eder.
- Veri/tablolar silinmez. XP tekillik kısıtı, hesap satır kilidi ve append-only defter korunur.

Geri dönüş: `supabase/rollback/quests_v5_before_rewards.sql`, worker'lar durdurulup transaction içinde çalıştırılır. V5 ödülü varsa bilinçli olarak reddeder; bu durumda veri koruyan ileri düzeltme gerekir. İlk V5 ödülünden sonra doğrudan V4 worker'a dönülmemelidir. Geri dönüş scripti additive kolonları/yuvaları tutar; veri silmez.

Önceden mevcut advisor bulguları: private scheduler_config üzerinde politika yok (istemciye açık olmamasıyla uyumlu); is_admin/is_coach_of SECURITY DEFINER erişim uyarıları; sızmış parola koruması kapalı. Bu görev kapsamında canlı ayarlar değiştirilmedi.
Kaynaklar:
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Test sonuçları

- `npm test`: mevcut 9/9 uygulama paketi, 30/30 görev birim testi (9 yeni V5), 10/10 antrenman esnekliği testi geçti.
- `npm run test:quests:db`: gerçek yerel PostgreSQL 17 üzerinde 11/11 senaryo geçti. Migration, ödül öncesi rollback, ödül sonrası rollback reddi, eski XP/rozet koruma, paralel worker/tekrar, 8/16 set, haftalık XP, düzeltme/ters kayıt, RLS, manuel RPC reddi, eski worker reddi, unique constraint, scheduler catch-up ve 3 dinlenme sınırı.
- Aynı DB koşusunda gerçek Deno HTTP giriş noktası + yerel PostgreSQL geçti. Auth sentetik doğrulama sunucusudur; hosted Supabase Auth testi değildir.
- `npx deno check supabase/functions/quests-refresh/index.ts`: geçti.
- Chromium 320/375/390/430: 3 günlük/6 haftalık kart, detay, manuel alanların yokluğu, yatay taşma, mevcut grafiğin korunması, önizleme alt menüsü geçti. Görüntü görsel olarak incelendi.
- Mevcut uygulama testleri: çevrimdışı yeniden açılma/pending kayıt, bağlantı sonrası yeniden gönderme, ikinci cihaz revision çatışması, yükleme sırasında yeni değişikliğin korunması ve PWA alt menü yardımcıları geçti.
- `git diff --check`: geçti.
- WebKit AÇILAMADI: sistem kütüphaneleri eksik. install-deps root geçişi başarısız oldu. Başarılı sayılmadı.

## Değiştirilen dosyalar

`app.js`, `sw.js`; `quests/engine-v5.mjs`, `quests/worker.mjs`, `quests/scheduler.mjs`, `quests/bootstrap.mjs`, `quests/client.mjs`, `quests/coach.mjs`, `quests/ui.mjs`, `quests/quests.css`; migration ve rollback dosyaları; `tests/quests/v5.test.mjs`, `tests/quests/client.test.mjs`, `tests/quests/database.mjs`, `tests/quests/browser.mjs`; bu rapor. V4 engine yalnız ortak yardımcılar ve eski kural regresyonları için tutuldu, çalışan worker V5'i kullanır.

## Açık işler / devam sırası

1. Geliştirme dalındaki güncel commit ve çalışma ağacını kontrol et. Geçmiş testleri ancak ilgili kod değişirse tekrarla.
2. V5 için hosted test ortamında gerçek Auth/PostgREST/Edge + scheduler entegrasyonu henüz yapılmadı. Yerel test bunun yerine geçti diye raporlanmamalı.
3. WebKit sistem bağımlılıkları bulunan ortamda aynı browser testi; ardından fiziksel iPhone Safari ve ana ekran PWA'da klavye, ekran kilidi/geri dönüş, tam uygulama çevrimdışı açılış, alt menü ve iki cihaz senkronizasyonu doğrulanmalı. Önizleme tüm uygulama testi değildir.
4. Yayın onayından önce canlı veri yedeği ve migration ön kontrolü alınmalı. Cutover/legacy freeze davranışı yukarıdaki sınırlarıyla incelenmeli.
5. Yalnız açık yayın onayı sonrası: V4 scheduler/worker durdur, migration uygula, V5 refresh ve scheduler Edge bundle'larını dağıt, scheduler'ı aç, sunucu smoke testi yap, ana dala birleştir/Pages dağıt. Frontend tek başına yayımlanmamalı.
6. İlk V5 ödülü öncesi sorun varsa transaction içindeki rollback; ödül sonrası sorun varsa worker'ları durdurup defteri koruyan ileri düzeltme. Kullanıcı kayıtlarını silme.

## Canlıya alma durumu

Geliştirme ve yerel doğrulama tamamlandı; fiziksel cihaz ve hosted V5 entegrasyonu açık. Üretim dağıtımı, ana dala birleştirme ve canlı migration yapılmadı. Yayın onayı istenmedi; önce açık doğrulamalar tamamlanmalı.
