# V5 görevlerini hemen açma — ilerleme ve yayın öncesi rapor

16 Kasım 2026, Europe/Istanbul. Dal: `fix/v5-immediate-activation`.
Taban: `b9fc73d`. Ana dala birleştirme, Pages yayını ve canlı Supabase değişikliği YAPILMADI.

## Kanıtlanan neden ve mevcut durum

Önceki `20261115103440_quests_v5_automation.sql`, XP defterinde kaydı bulunan hesapların V5 başlangıcına bir gün ekliyor. Motor günlük görevleri bu tarihten itibaren üretiyor. 15 Kasım Pazar günü başlangıç 16 Kasım Pazartesi olduğu için haftalık döngü de hiç çalışmıyordu. Arayüz boş görev listesi ve başlangıç bildirimini gösteriyordu. Asıl neden PWA önbelleği değildi.

16 Kasım salt okunur canlı kontrolü: başlangıç 16 Kasım, processed_day 16 Kasım, generation/processed_generation 157/157; 9 görev üretilmiş. Toplam XP 975, seviye 4, taban 750, sonraki seviye 1100: ekrandaki **225/350**, toplam XP değil seviye içi ilerlemedir. Ledger 21 satır; eski net XP 975, V5 XP 0. Bu çalışmada canlı veri yazılmadı.

15 Kasım güncel kaydı rest; gün planı cutoff 14 Kasım 21:00 UTC = 15 Kasım 00:00 İstanbul; o tarihte workout kaynak olayı yok. Başlangıç dışı kaldığından 15 XP verilmemiş. Düzeltme yayınlandığında, o andaki doğrulamalar da uygunsa bu tek gün 15 XP alabilir; diğer eski antrenmanlar yeniden ödüllendirilmez.

## Hazırlanan düzeltmeler

- Yalnız 15 Kasım veya öncesinde kaydolmuş, başlangıcı tam 16 Kasım olan ertelenmiş hesaplar 15 Kasım'a alınır. Sonraki kullanıcılar değişmez. Migration tekrarında generation tekrar artırılmaz.
- Geçiş günü eski günlük ödül almış hesaplar için o gün V5 kaynaklarından dışlanır. Eski ödül anahtarları/tutarları aynen korunur. 15 Kasım öncesi setler haftalık hedeflere de katılmaz.
- Günlük 30/20/20 ve haftalık 50/60/50/40/70/30 XP ile 8/16 ve kas hedefleri korunur.
- Günlük **genel** 250 sınırı artık haftalık ödülleri de kapsar. Haftalık ödül tarihi pazartesi değil hedefe ulaşılan gündür. Eski ödüller kapasiteye dahil edilir, azaltılmaz. Sınıra takılan görevde gerçek verilen XP gösterilir; kalan tutar sonraki güne taşınmaz.
- Dinlenme Günü kartı ve görev adı; gece yarısı planı + güncel rest + geçmiş kaynak olaylarında antrenman bulunmaması + gün bitişi + haftada üç sınırı. Yapılmış antrenmanı sonradan rest'e çevirme dinlenme XP'si üretmez.
- Yüklenme mesajı gerçek pending durumundan ayrıldı. Aktif hesaplarda başlangıç bildirimi koşul gereği kaybolur.
- Motor revizyonu 5.1 ile scheduler/cache kısa devresi eski sonucu tutmaz. SW önbellek sürümü 21. Eski V4 motoru audit testleri için değiştirilmedi.

## Dosyalar

- `quests/engine-v5.mjs`: sınır, ödül tarihi, geçiş dışlaması, dinlenme ve motor revizyonu.
- `quests/worker.mjs`, `quests/scheduler.mjs`: sunucu yeniden hesaplama ve kaynak olayları.
- `quests/ui.mjs`, `quests/quests.css`: dinlenme kartı, yüklenme ve sınır açıklaması.
- `sw.js`: önbellek sürümü.
- `supabase/migrations/20261116083840_quests_v5_immediate_activation.sql`: kontrollü geçiş; yalnız yerelde uygulandı.
- `tests/quests/v5.test.mjs`, `tests/quests/database.mjs`, `tests/quests/browser.mjs`: regresyonlar.
- Bu rapor.

## Doğrulama

- `npm test`: uygulama regresyonları + 35 quest testi + 10 workout-flex testi geçti.
- `npm run test:quests:db`: 12/12 gerçek yerel PostgreSQL senaryosu geçti. İki eşzamanlı worker, yenileme, 8/16 set, bitirme, haftalık ödüller, kaynak koruma, eski ledger koruma, migration tekrar güvenliği, 15 Kasım dinlenmesi, RLS/yetki ve Deno HTTP testi dahil. HTTP kimlik doğrulaması fixture'dır; hosted Auth testi değildir.
- `npx deno check supabase/functions/quests-refresh/index.ts`: geçti.
- Chromium/WebKit mobil testleri: CI ortamında geçti; aşağıdaki son eke bak.
- Fiziksel iPhone Safari, ana ekran PWA ve gerçek kullanıcı oturumuyla hosted Auth/Edge uçtan uca testi yapılmadı.

## Devam / yayın kontrolü

Önce dalın son commit'ini ve çalışma ağacını kontrol et; tamamlanan testleri sebepsiz tekrarlama. Yerel browser sonucu ve GitHub CI sonucu aşağıdaki eklerde kayıtlı.

Yalnız yeni açık yayın onayı sonrası: canlı durumu yeniden oku ve yeni V5 kazanımları varsa korunacak ödüller için dry-run karşılaştırmasını yap. 250 sınırı düzeltmesi yeni kazanılmış V5 ödüllerini azaltacaksa otomatik yayınlama; önce geçişi bu kazanımları koruyacak şekilde genişlet. Worker/scheduler'ı birlikte durdur, yedek ve kaynak/ledger toplamlarını doğrula, migration ve iki Edge bundle'ını birlikte yayınla, reconciliation smoke testi yap, sonra frontend/Pages yayınla. SQL tek başına eski worker çalışırken uygulanmamalı. Yayın sonrası 15 Kasım için en fazla bir 15 XP kaydı, eski 975 XP'nin korunması ve kaynak tablolarının değişmemesi doğrulanmalı.

Henüz canlıya alma onayı yok. Geliştirme dalı incelenebilir; fiziksel cihaz ve hosted entegrasyon sınırları açıkça korunmalıdır.

## Yerel mobil doğrulama eki

Chromium: 320/375/390/430 px genişliklerde 4 günlük/6 haftalık kart, 225/350 XP, dinlenme kartı, sekme geçişleri, detay penceresi ve yatay taşma testleri geçti. 390 px görüntü görsel olarak incelendi. İlk denemede dinlenme kartının `aside` etiketi uygulamanın kenar menü CSS'ini alıyordu; `div role=note` ile düzeltildi ve test geçti.

Yerel WebKit bağımlılık eksikliği nedeniyle açılamadı. Otomatik bağımlılık kurulumu root geçişinde başarısız oldu. GitHub Actions WebKit doğrulaması aşağıdaki son ekte tamamlandı; fiziksel cihaz testi yerine geçmez.

## GitHub CI tamamlandı

Test edilen uzak uygulama commit'i: `ddab8ffeca284b753d63302cca7d559f35836d8b` (yerel c2a0de9 ile aynı dosya ağacı).
Taslak PR: https://github.com/kaanaydin48/Gym/pull/23

- Quest kuralları, PostgreSQL, Deno ve **Chromium + WebKit dört mobil genişlikte başarılı**: https://github.com/kaanaydin48/Gym/actions/runs/43833728810
- Member directory ve mevcut Hacim Akışı mobil düzen kontrolleri başarılı: https://github.com/kaanaydin48/Gym/actions/runs/43833728844
- Yerel WebKit eksikliği CI ortamında giderildi. Fiziksel iPhone/PWA ve gerçek kullanıcıyla hosted Auth/Edge uçtan uca testi hâlâ yapılmadı.
- Canlı security advisor salt okunur kontrolünde önceki rapordaki is_admin/is_coach_of ve parola koruma uyarıları görülüyor; bu düzeltme yetki/şema oluşturmaz. Referanslar: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable ve https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . Özel yedek/scheduler tablolarındaki RLS/no-policy INFO kayıtları erişimi kapalı tutan mevcut yapıdır.

Kod ve otomatik testler tamamlandı; yayın için hazırlanmış durumda. Canlıya alınmadı. Yeni yayın onayı gelirse yukarıdaki canlı preflight ile başlanmalı; önceki tamamlanmış geliştirme işleri yeniden yapılmamalı.
