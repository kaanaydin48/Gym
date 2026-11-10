# V5 çalışma ve devam kaydı

10 Kasım 2026. Dal: `codex/quests-v5`. Taban: `dce587d9d4affbaedddb51eb741bb2f96760c154`.
Durum: Geliştirme ve yerel doğrulama tamamlandı; üretime yayınlanmadı. Canlı Supabase yalnız salt okunur incelendi. Test Supabase'e de değişiklik yapılmadı.

## Tamamlananlar

- V4 engine/worker/UI, SQL kısıtları, canlı tablo yapıları ve antrenman muscle alanı incelendi.
- Güvenli geçiş planı kodlamadan önce `docs/quests-v5-migration-plan.md` dosyasında yazıldı.
- Günlük 30/20/20 XP, başlangıç 8/16, sunucuda gün başında sabitlenen son 28 günlük medyana dayalı kişiselleştirme.
- Altı haftalık kas hedefi; yalnız tamamlanmış antrenmandaki geçerli setler. Ön/arka kol birleşir; bilinmeyen kas grubu haftalık XP almaz.
- Planlı/antrenmansız dinlenme ertesi gün 15 XP, haftada üç. Silinen antrenmanın kaynak olayları da kontrol edilir. Seri yalnız ardışık antrenman günlerinden oluşur; dinlenme eklemez (bu uygulamada araya giren dinlenme ardışık gün serisini sonlandırır).
- Günlük, haftalık ve rekor ödüllerinin toplamına 250 XP tavanı. Haftalık ödül tarihi eşiğe ulaşılan gün; kırpılan tutar kartta gösterilir.
- Geçişte mevcut ledger toplamı/rozet/unvan baseline olarak korunur. Eski ledger anahtarlarına düzeltme yazılmaz. V5 düzeltmeleri append-only telafi kayıtlarıdır.
- V5'e geçen hesaplarda kanıt/manuel onay/hedef değişikliği yazımları SQL trigger ile reddedilir; eski geçmiş silinmez. V4 hesapları aktivasyona kadar eski davranışı sürdürür.
- V5 UI otomatik, minimal beyaz; koç manuel görev alanı ve kişisel manuel hedef düğmesi V5 hesaplarında kaldırılır. Hacim Akışı ve workout-metrics değiştirilmedi.
- CI V5 veritabanı ve Chromium/WebKit kontrollerini kapsayacak biçimde genişletildi.

## Değişen dosyalar

- `.github/workflows/quests-v4-check.yml`
- `quests/bootstrap.mjs`, `quests/ui.mjs`, `quests/worker.mjs`
- `quests/v5-engine.mjs`, `quests/v5-worker.mjs`
- `supabase/migrations/20261110120337_quests_v5_transition.sql`
- `tests/quests/v5.test.mjs`, `tests/quests/database-v5.mjs`, `tests/quests/browser-v5.mjs`
- Bu dosya ve `docs/quests-v5-migration-plan.md`

## Test sonuçları

- Mevcut uygulama: 9/9 test paketi geçti (kayıt/senkronizasyon, grafikler, programlar, PWA dock birimleri).
- Görevler: 33/33 birim testi geçti (24 mevcut + 9 V5).
- Gerçek yerel PostgreSQL 17: V4 20/20, V5 6/6 senaryo geçti. V5: migration, altı slot, eski XP/rozet, iki worker paralelliği, immutable hedef, RLS, anonim/diğer üye erişimi, manuel RPC engeli, geçmiş düzeltme, tekrar kazanım, rollback.
- Deno `quests-refresh` tip kontrolü geçti. V4 DB testinde yerel gerçek HTTP/PG ve sentetik Auth kontrolü geçti; gerçek hosted Auth yerine geçmez.
- Chromium V4 ve V5: 320/375/390/430 px; sekme/değişmeyen grafik DOM/taşma/detay paneli geçti. V5 kanıt formu yokluğu doğrulandı. 390 px ekran görüntüsü görsel olarak incelendi.
- WebKit indirilmiş olsa da eksik sistem kütüphaneleri nedeniyle yerelde çalıştırılamadı. Fiziksel iPhone Safari/PWA testi yapılmadı.
- İlk tam test koşusundaki asset hatası, kaynakları alırken binary dosyaların eksik olmasındandı. Asıl depodaki asset arşivi alındı; sonraki 9/9 geçti. Dosya içeriği değiştirilmedi.
- İlk V5 DB fixture schema etiketi eksikti; fixture düzeltildi, 6/6 geçti.
- GitHub CI sonucu bu kayıt hazırlanırken henüz alınmadı.

## Yayın ve açık işler

Tam V5 canlıya hazır olarak işaretlenmedi. Kullanıcının yayın onayı mevcut, ancak aynı istekte canlı Supabase müdahalesi yasak. Altı haftalık slot ve güvenli sunucu doğrulaması migration + iki Edge fonksiyonunun birlikte yayınını gerektiriyor. Sadece Pages yayını V5'i etkinleştirmez. Ana dala merge/Pages, canlı SQL ve Edge değişikliği yapılmadı.

Sonraki oturumda:
1. Bu kaydı ve dalın son commit/PR/CI durumunu oku; tamamlanan testleri gerekmedikçe tekrarlama.
2. CI WebKit sonucunu incele; tam uygulama gerçek Auth/Edge/scheduler/offline geçişini ayrı test Supabase projesinde sentetik hesapla doğrula. Test ortamı `sucoijqzhfifwmwrprww`; üretim `aryzgrgjwjdxumbddank`.
3. Fiziksel iPhone Safari/PWA: ekran kilidi/geri dönüş, ağ kesintisi, gece yarısı, alt menü ve hesap değişimi kontrolü.
4. Üretim müdahalesi sınırı çözülmeden migration/Edge dağıtma. Sınır kalkarsa planın yayın sırasını uygula; mevcut XP/antrenman digest karşılaştırması ve Auth/RLS kontrolleri yap.
5. Geçiş sonraki Türkiye pazartesisi başlar; yeni hesaplar bu tarihten sonra kayıt gününde V5'e katılır. Aktivasyondan sonra V4 worker'a geri dönme; V5 XP'yi yeniden hesaplayıp geri alabilir. Sorunda görev worker'larını durdur ve ileri düzeltme uygula.

## Yerel komutlar

`npm ci`; `npm test`; `npm run test:quests:db`; `node tests/quests/database-v5.mjs`; `npx deno check supabase/functions/quests-refresh/index.ts`; `node tests/quests/browser-v5.mjs`; `QUEST_BROWSER=webkit node tests/quests/browser-v5.mjs`.

Yerel testler yalnız sentetik veriler kullanır; üretim bağlantısı açmaz.
