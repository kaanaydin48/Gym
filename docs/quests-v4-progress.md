# Görev V4 — geliştirme devam kaydı

9 Kasım 2026. **Kullanıcının açık onayıyla çekirdek Görev V4 sürümü yayınlandı. Aşağıdaki tarihsel kayıtlar ve kalan kapsam sınırlamaları korunmuştur.**
Dal: `feature/quests-v4-20261108`. Ana dal tabanı: `0100bc6b62eebb6d3064c20f34336f2d364c90c4`.
İlk yerel kilometre taşı: `716099f`; ikinci yerel commit: `7fb1c2a`. GitHub geliştirme dalı ilk kaydı: `2cb4c68a911b632fe177df585c033eb252887e72` (aynı dosya ağacı, farklı commit zinciri). En güncel commit için bu dalda `git log -1` kullanın.
Önceki geliştirme aşamasında canlıya dokunulmadı. 9 Kasım yayın onayından sonra aşağıdaki üretim kurulumu ve PR #18 birleştirmesi yapıldı; özellik bayrağı açık.

## Tamamlanan geliştirmeler

- Türkiye gece yarısı/Pazartesi dönemleri, günlük 3/haftalık 4 görev, antrenman/dinlenme/plansız gün ayrımı. Tam dinlenme haftası ayrı görevler alır; bilinmeyen plan bedava ödül üretmez.
- Günlük 250 XP; haftalık ayrı havuz ve 4/4 bonus; doğrulanmış kayıt bazlı PR; kademeli seviye, iki bağımsız seri, rozet/unvan, kişisel karşılaştırmalar.
- PostgreSQL hesap kilidi ve tekil işlem anahtarları; append-only XP defteri, ters kayıt, kaynak önce/sonra denetimi. Geçmiş düzeltmeler PR/görev/XP/rozet sonuçlarını yeniden hesaplar.
- Günlük planlar gece yarısı/enrollment anında; haftalık hedefler haftanın başlangıcında sabitlenir. İleri tarihli değişiklik günlük plana yansır; geçmiş takvim değişikliği geriye ödül üretmez. Kaçırılmış dönemler tarihsel plan olaylarından tamamlanır.
- Koçun yalnız atanmış üyeyi yönetmesi, görev değiştirme/manuel atama/onay/geri alma; kişisel hedefin gelecek haftadan başlaması; kazanılmış unvan seçimi; tek seferlik kutlama kaydı.
- Kompakt beyaz kart, günlük/haftalık sekme, alt detay ve doğrulama geçmişi, rozetler/karşılaştırmalar; mevcut grafik tasarımı korunur.
- Kalıcı hesap bazlı çevrimdışı eylem kuyruğu, yeniden deneme tekilleştirmesi; süresi dolmuş başvuru kanıtı korunur ve sonraki başvuruları engellemez. İstemci XP oluşturmaz.
- Ortak workout-metrics.js: Hacim Akışı, özet ve görevler aynı geçerli setleri kullanır. Dips için sonradan girilen kg artık sıfırlanmaz; süre hareketlerine hacim yazılmaz.
- Yalnız loopback veya kesin test ref'ini kabul eden Edge giriş noktası, yerel zamanlanmış worker ve üretime bağlanmayan geliştirme build aracı. PR/manual CI kontrol dosyası hazır; uzakta çalıştırılmadı.

## Doğrulama

- Mevcut 9/9 test paketi, yeni 23/23 birim testi geçti.
- Yerel gerçek PostgreSQL 17.11: 20/20 senaryo geçti. RLS/koç sınırları, paralel bağlantılar, tekrar işlem, düzeltme/geri kazanma, kapalı dönemler, iki seri, başarısız işlem rollback, kaydedilmiş antrenmanın korunması, başvuru/onay geçmişi ve scheduler kapsanır.
- Deno HTTP giriş noktası gerçek yerel PostgreSQL ile çalıştırıldı. Auth için sentetik HTTP sunucusu kullanıldı; gerçek Supabase Auth testi değildir. Deno tip kontrolü geçti.
- Chromium 320/375/390/430 px: 3/4 sekme, detay paneli, kanıt formu, grafik DOM korunması, yatay taşma ve önizleme alt menüsü geçti. Gerçek uygulamanın alt menüsü/PWA testi değildir.
- WebKit sistem kütüphaneleri eksik olduğundan başlatılamadı. Fiziksel Safari/PWA testleri yapılmadı; başarılı sayılmıyor.
- Yerel geliştirme build'i örnek anon anahtarla üretildi; bu gerçek Auth testi değildir.

## Supabase ortamları

Üretim: `aryzgrgjwjdxumbddank` — değiştirilmedi.
Test: `sucoijqzhfifwmwrprww` — önceki çalışmada restore edildi; 9 Kasım son kontrol ACTIVE_HEALTHY. Public şeması salt okunur incelendi: profiles, programs, assignments, workout_logs, gym_account_state, coach_notes var; list_tables tümü için 0 satır raporladı. coach_program_assignments yok; migration izin daraltması tablo varsa çalışacak biçimde düzeltildi. Mevcut save_gym_state/gym_private.save_checked_state ve RLS politikaları incelendi. Görev DDL dosyası yalnız bu test projesine execute_sql ile transaction içinde uygulandı (migration history kaydı oluşturulmadı). 11 yeni tablonun tamamında RLS açık; authenticated doğrudan INSERT/UPDATE/DELETE yetkileri yok. Advisor öncesi/sonrası aynı iki INFO bulgusu (mevcut private arşiv tablolarında RLS var, politika yok); yeni görev bulgusu yok. Sonraki entegrasyon koşusunda iki sentetik Auth hesabı ve bir günlük değerlendirme kaydı oluşturuldu; gerçek kullanıcı/antrenman verisi kullanılmadı. Aşağıdaki 9 Kasım entegrasyon ekini okuyun.

## Yeni veri yapıları

Migration: `supabase/migrations/20261108202552_quests_v4_foundation.sql` (CLI ile oluşturuldu; geliştirme taslağı).
quest_accounts, quest_plan_snapshots, quest_day_plans, user_quests, xp_ledger, quest_actions, quest_overrides, quest_audit_log, quest_reward_receipts, quest_personal_goals, quest_source_events; quest_private iç işlemleri ve kontrollü public RPC'ler.
Seviye/rozet/seri sonuçları quest_accounts.result içinde türetilir; gereksiz eşdeğer tablolar açılmadı.

## Dosyalar

Mevcut: app.js, auth-guard.js, index.html, tests/summary-flow.cjs.
Yeni: workout-metrics.js; package.json/lock; .gitignore; quests/ tüm görev modülleri; scripts/build-quest-dev.mjs; tests/quests/; yukarıdaki migration; supabase/functions/quests-refresh/index.ts; .github/workflows/quests-v4-check.yml; bu devam kaydı.

## Açık işler ve sonraki adım

1. Test şeması ve gerçek Auth/PostgREST/Edge entegrasyonu doğrulandı. Tam uygulama geliştirme build'i hâlâ loopback ister; test ref'iyle tarayıcı entegrasyonuna genişletilmesi ve koç akışının gerçek oturumla doğrulanması kaldı.
2. Sunucu periyodik işleyicisini test ortamına bağla; yarış koşullarını gerçek API ve iki oturumla doğrula. Yerel scheduler var, hosted cron yok.
3. Koç ekranı, profil unvanı/kutlama ve doğrulama geçmişinin tarayıcı uçtan uca testini genişlet.
4. Mevcut auth-guard'ın ilk açılışta ağ gereksinimi ve service worker/PWA çevrimdışı açılışı çözülmüş değil. Kayıt kuyruğu testi tam çevrimdışı uygulama testi sayılmaz.
5. Fiziksel iPhone Safari/PWA safe-area, klavye, ekran kilidi/geri dönüş, ağ kesintisi ve gerçek alt menü testleri.
6. Zorluk bonusu başlangıçta sıfırdır; kontrollü bonus politikası ve arayüz ayarı henüz yok. Efsane dahil başarı eşiklerini ürün incelemesinden geçir.
7. Canlı öncesi migration/advisor incelemesi, yedek/geri dönüş planı, test raporu ve açık yayın onayı. Mevcut kullanıcılara geçmişe dönük XP toplu dağıtımı yapılmamalı.

Devam ederken önce bu kayıt, git status ve son commit kontrol edilmeli. Önceki analiz/başarılı testleri değişiklik veya yeni risk yoksa tekrar etmeyin.

Advisor bilgi açıklaması: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## 9 Kasım — gerçek hosted entegrasyon tamamlandı

- quests/runtime-config.mjs yalnız yerel gym_quests_test veya sucoijqzhfifwmwrprww API + aynı projenin DB hostunu kabul eder. Üretim/başka proje engellenir. Sağlayıcının DB URL seçenekleri temizlenir; hosted bağlantıda TLS sertifika doğrulaması zorunludur.
- quests-refresh test projesine kuruldu (v3). Fonksiyon Auth /user üzerinden token doğrular; verify_jwt=false yalnız bu uygulama içi doğrulama nedeniyle kullanılır. Anonim istek işlem yapamaz. Tarayıcı CORS yalnız http://127.0.0.1:8080 kabul eder.
- İlk iki boot denemesi sağlayıcının URL seçenekleri nedeniyle başarısızdı; günlüklerden teşhis edildi ve seçeneklerin sürücü ayarlarını değiştirmesi engellenerek düzeltildi.
- tests/quests/hosted-smoke.mjs: gerçek endpoint üzerinde 5/5 kontrol geçti (401 anonim, 401 sahte token, 403 yabancı origin, 405 yöntem, 204 preflight).
- tests/quests/hosted/integration.ts: kısa süreli rastgele anahtar korumalı geçici test fonksiyonu 15/15 assertion geçti. Auth admin API ile email_confirm=true sentetik hesap açıldı; e-posta gönderilmedi. İki gerçek parola oturumu, enrollment, Edge 200, sahte XP/kimlik reddi, PostgREST diğer üye görünmezliği, XP INSERT reddi, request_id tekilleştirme, iki eşzamanlı Edge çağrısı ve ledger toplamı 30 doğrulandı.
- Geçici quests-integration-test v2 artık yalnız 410 dönen emekli fonksiyondur; admin işlemi/anahtar kalmadı, gateway JWT zorunludur.
- Sentetik hesaplar ed8fd003-e12f-422f-b136-9c5c0b0e5dc1 ve 3b842bad-c61f-41fd-af9f-8b6986e4fac4 test ortamında denetim için bırakıldı. İkisi de banlandı; auth.sessions sayıları 0 olarak doğrulandı. Test XP/geçmişi silinmedi.
- Bu ek değişikliklerden sonra yerel 23 birim testi, 20 PostgreSQL senaryosu ve Deno tip kontrolü geçti. Hosted bağlantı kuralındaki son seçenek-temizleme değişimi ayrıca birim testinden geçti.
- Ek dosyalar: quests/runtime-config.mjs, tests/quests/runtime-config.test.mjs, tests/quests/hosted-smoke.mjs, tests/quests/hosted/integration.ts; Edge giriş noktası güncellendi.
- Sonraki adım: test ortamında scheduler kurulumu, koç UI entegrasyonu ve tam uygulama/PWA offline doğrulaması. Üretim hâlâ değiştirilmedi.

## 9 Kasım — yayın hazırlığı (açık kullanıcı onayı alındı)

Kullanıcı “Canlıya al” dedi. Üretim aktivasyonu artık yetkili; aşağıdaki hazırlıklar yayın doğrulaması sayılmaz.
- Üretim ana dalı hâlâ 0100bc6; kaynak değişiklikleri çatışmıyor.
- Üretim verisi yayın öncesi kontrol: gym_account_state 2 satır digest c2fc75f28906b1acdb4e8433e2b611ad; workout_logs 15 satır digest 003663e2befeb4ae8bae1d1027091c8d.
- Yeni scheduler migration ve Edge işleyicisi test projesinde kuruldu. Vault içinde oluşturulan anahtar istemciye verilmez; cron pg_net ile her dakika çağırır. İlk çağrı HTTP 200 / processed=2 / failed=[] döndü.
- Yayın bağlantıları yalnız kesin üretim ref'i ve GitHub Pages origin'i için açıldı; test/üretim DB karışması reddedilir. Feature flag ve cache sürümü yayına hazırlandı.
- 9 mevcut test paketi + 24 görev birim testi geçti. Son PostgreSQL/CI/tarayıcı sonuçları ve gerçek üretim dağıtım durumu sonraki yayına alma kaydında belirtilmeli.
- Fiziksel iPhone/PWA, ilk çevrimdışı açılış ve tam koç arayüzü testleri hâlâ tamamlanmış sayılmaz. Çevrimdışı kuyruk ve sunucu RLS testleri bunların yerine geçmez.


## Üretim yayını — 9 Kasım 2026

- Açık kullanıcı komutu: “Canlıya al”. PR #18 birleştirildi: dce587d9d4affbaedddb51eb741bb2f96760c154. Yayın adayı a860d9d900a41590ee645c7020368bfe84591e8f.
- GitHub Actions 42591489041 (Quest V4) ve 42591488936 (mevcut üye/grafik kontrolleri) başarılı. Chromium ve WebKit mobil kontrolleri CI'da geçti. Bu oturumdaki yerel Chromium denemesi tarayıcı cache'i eksik olduğundan çalışmadı; CI başarısıyla karıştırılmamalı.
- Üretim Supabase ary... projesine quests_v4_foundation ve quests_v4_scheduler migration'ları apply_migration ile kuruldu. quests-refresh ve quests-scheduler v1 aktif.
- Cron quests-v4-minute her dakika çalışıyor. İlk üretim çağrısı HTTP 200, processed=0, failed=[]; otomatik cron çalışması succeeded. Üyeler ilk açılışta görev hesabına kaydolur; mevcut antrenmanlara dokunulmaz.
- Üretim HTTP kontrolleri: anonim ve geçersiz kullanıcı 401; yabancı origin 403; scheduler anahtarsız/yanlış anahtarla 401; Pages CORS 204. Sunucu anahtarı Vault'ta, istemcide yok.
- Mevcut veri koruması doğrulandı: yayın öncesi/sonrası 2 snapshot ve 15 workout_logs satırı, yukarıdaki digest değerleri birebir aynı. Kullanıcı kaydı silinmedi/değiştirilmedi.
- Üretim advisor: önceki is_admin/is_coach_of SECURITY DEFINER uyarıları ve leaked-password koruması uyarısı devam ediyor. Yeni private scheduler_config tablosunda RLS/no-policy INFO bilinçli varsayılan reddetme tasarımıdır; anon/authenticated yetkisi yok.
- Eksik kapsam: fiziksel iPhone/PWA testi, ilk çevrimdışı Auth açılışı, tam koç UI E2E ve zorluk bonusu ayarı tamamlanmadı. Bunlar yayında tamamlanmış özellik olarak raporlanmamalı. Çevrimdışı kuyruk, görev hesaplamaları ve API yetki testleri geçti.
- Geri dönüş: frontend quests/config.js bayrağını false yapıp yeni cache sürümüyle yayınla; cron görevini devre dışı bırak. Yeni tabloları/ledger'ı silme; antrenman kayıtlarına rollback yazma. Ana dal önceki sürümü 0100bc6. Sunucu veya UI hatası durumunda önce görev özelliği kapatılmalı, mevcut antrenman sistemi korunmalı.

Kaynaklar: https://github.com/kaanaydin48/Gym/pull/18 ; https://github.com/kaanaydin48/Gym/actions/runs/42591489041 ; https://github.com/kaanaydin48/Gym/actions/runs/42591488936
Advisor açıklamaları: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable ; https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Yayın sonrası son doğrulama — 9 Kasım
GitHub Pages /Gym/index.html yeni quests-v4-20261109 sürümünü, quests/config.js etkin bayrağı ve quests/bootstrap.mjs üretim API kontrolünü HTTP 200 ile sunuyor. Üretim zamanlayıcısının son üç çağrısı (397–399) HTTP 200, failed=[]; bekleyen hesap olmadığından processed=0. Bu kontrol kullanıcı oturumuyla fiziksel cihaz testi değildir. Yayın tamamlandı; yukarıdaki kapsam sınırlamaları devam ediyor.
