# Görev V4 — geliştirme devam kaydı

9 Kasım 2026. **Geliştirme devam ediyor; yayınlanmaya hazır değil.**
Dal: `feature/quests-v4-20261108`. Ana dal tabanı: `0100bc6b62eebb6d3064c20f34336f2d364c90c4`.
İlk yerel kilometre taşı: `716099f`. En güncel commit için bu dalda `git log -1` kullanın.
Canlı Supabase'e migration/veri yazımı yapılmadı; ana dala birleştirme veya Pages yayını yapılmadı. Özellik bayrağı kapalı.

## Tamamlanan geliştirmeler

- Türkiye gece yarısı/Pazartesi dönemleri, günlük 3/haftalık 4 görev, antrenman/dinlenme/plansız gün ayrımı. Tam dinlenme haftası ayrı görevler alır; bilinmeyen plan bedava ödül üretmez.
- Günlük 250 XP; haftalık ayrı havuz ve 4/4 bonus; doğrulanmış kayıt bazlı PR; kademeli seviye, iki bağımsız seri, rozet/unvan, kişisel karşılaştırmalar.
- PostgreSQL hesap kilidi ve tekil işlem anahtarları; append-only XP defteri, ters kayıt, kaynak önce/sonra denetimi. Geçmiş düzeltmeler PR/görev/XP/rozet sonuçlarını yeniden hesaplar.
- Günlük planlar gece yarısı/enrollment anında; haftalık hedefler haftanın başlangıcında sabitlenir. İleri tarihli değişiklik günlük plana yansır; geçmiş takvim değişikliği geriye ödül üretmez. Kaçırılmış dönemler tarihsel plan olaylarından tamamlanır.
- Koçun yalnız atanmış üyeyi yönetmesi, görev değiştirme/manuel atama/onay/geri alma; kişisel hedefin gelecek haftadan başlaması; kazanılmış unvan seçimi; tek seferlik kutlama kaydı.
- Kompakt beyaz kart, günlük/haftalık sekme, alt detay ve doğrulama geçmişi, rozetler/karşılaştırmalar; mevcut grafik tasarımı korunur.
- Kalıcı hesap bazlı çevrimdışı eylem kuyruğu, yeniden deneme tekilleştirmesi; süresi dolmuş başvuru kanıtı korunur ve sonraki başvuruları engellemez. İstemci XP oluşturmaz.
- Ortak workout-metrics.js: Hacim Akışı, özet ve görevler aynı geçerli setleri kullanır. Dips için sonradan girilen kg artık sıfırlanmaz; süre hareketlerine hacim yazılmaz.
- Loopback dışını reddeden Edge giriş noktası, yerel zamanlanmış worker ve üretime bağlanmayan geliştirme build aracı. PR/manual CI kontrol dosyası hazır; uzakta çalıştırılmadı.

## Doğrulama

- Mevcut 9/9 test paketi, yeni 22/22 birim testi geçti.
- Yerel gerçek PostgreSQL 17.11: 20/20 senaryo geçti. RLS/koç sınırları, paralel bağlantılar, tekrar işlem, düzeltme/geri kazanma, kapalı dönemler, iki seri, başarısız işlem rollback, kaydedilmiş antrenmanın korunması, başvuru/onay geçmişi ve scheduler kapsanır.
- Deno HTTP giriş noktası gerçek yerel PostgreSQL ile çalıştırıldı. Auth için sentetik HTTP sunucusu kullanıldı; gerçek Supabase Auth testi değildir. Deno tip kontrolü geçti.
- Chromium 320/375/390/430 px: 3/4 sekme, detay paneli, kanıt formu, grafik DOM korunması, yatay taşma ve önizleme alt menüsü geçti. Gerçek uygulamanın alt menüsü/PWA testi değildir.
- WebKit sistem kütüphaneleri eksik olduğundan başlatılamadı. Fiziksel Safari/PWA testleri yapılmadı; başarılı sayılmıyor.
- Yerel geliştirme build'i örnek anon anahtarla üretildi; bu gerçek Auth testi değildir.

## Supabase ortamları

Üretim: `aryzgrgjwjdxumbddank` — değiştirilmedi.
Test: `sucoijqzhfifwmwrprww` — önceki çalışmada restore edildi; 9 Kasım son kontrol ACTIVE_HEALTHY. Public şeması salt okunur incelendi: profiles, programs, assignments, workout_logs, gym_account_state, coach_notes var; list_tables tümü için 0 satır raporladı. coach_program_assignments yok; migration sonundaki izin daraltma bu tabloyu varsayıyor. Henüz test projesine de migration veya test verisi yazılmadı. Gerçek kurulumdan önce mevcut fonksiyon/politika/trigger ve auth şeması önkoşulları incelenmeli.

## Yeni veri yapıları

Migration: `supabase/migrations/20261108202552_quests_v4_foundation.sql` (CLI ile oluşturuldu; geliştirme taslağı).
quest_accounts, quest_plan_snapshots, quest_day_plans, user_quests, xp_ledger, quest_actions, quest_overrides, quest_audit_log, quest_reward_receipts, quest_personal_goals, quest_source_events; quest_private iç işlemleri ve kontrollü public RPC'ler.
Seviye/rozet/seri sonuçları quest_accounts.result içinde türetilir; gereksiz eşdeğer tablolar açılmadı.

## Dosyalar

Mevcut: app.js, auth-guard.js, index.html, tests/summary-flow.cjs.
Yeni: workout-metrics.js; package.json/lock; .gitignore; quests/ tüm görev modülleri; scripts/build-quest-dev.mjs; tests/quests/; yukarıdaki migration; supabase/functions/quests-refresh/index.ts; .github/workflows/quests-v4-check.yml; bu devam kaydı.

## Açık işler ve sonraki adım

1. Test Supabase önkoşullarını incele; test şemasını uyumlandır; gerçek Auth/PostgREST/Edge entegrasyonunu yalnız test ortamında doğrula. Mevcut Edge ve build yalnız loopback kabul eder; hosted test için yalnız kesin test ref'ini kabul eden ayrı yapılandırma gerekir.
2. Sunucu periyodik işleyicisini test ortamına bağla; yarış koşullarını gerçek API ve iki oturumla doğrula. Yerel scheduler var, hosted cron yok.
3. Koç ekranı, profil unvanı/kutlama ve doğrulama geçmişinin tarayıcı uçtan uca testini genişlet.
4. Mevcut auth-guard'ın ilk açılışta ağ gereksinimi ve service worker/PWA çevrimdışı açılışı çözülmüş değil. Kayıt kuyruğu testi tam çevrimdışı uygulama testi sayılmaz.
5. Fiziksel iPhone Safari/PWA safe-area, klavye, ekran kilidi/geri dönüş, ağ kesintisi ve gerçek alt menü testleri.
6. Zorluk bonusu başlangıçta sıfırdır; kontrollü bonus politikası ve arayüz ayarı henüz yok. Efsane dahil başarı eşiklerini ürün incelemesinden geçir.
7. Canlı öncesi migration/advisor incelemesi, yedek/geri dönüş planı, test raporu ve açık yayın onayı. Mevcut kullanıcılara geçmişe dönük XP toplu dağıtımı yapılmamalı.

Devam ederken önce bu kayıt, git status ve son commit kontrol edilmeli. Önceki analiz/başarılı testleri değişiklik veya yeni risk yoksa tekrar etmeyin.
