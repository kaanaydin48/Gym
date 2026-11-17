# Günlük İçerik V1 ilerleme — 17 Kasım 2026

Başlangıç: main `915abcfe465199d79483791d6d7647b5c030cc71`.
Dal: `feature/daily-content-v1-20261117`.
Kullanıcı bu kapsam için test sonrası doğrudan yayın izni verdi.

## Tamamlanan geliştirme
- Ayrı Senin İçin modülü: yatay 3 kart, tam metin, kaynak, kayıt, paylaşım ve geri bildirim.
- Hesaba özel günlük sabit seçim, İstanbul gün sınırı, tekrarı azaltma, sınırlı tercih ağırlıkları.
- Kişisel mesaj yalnız tamamlanmış sunucu kayıtlarından. Paylaşım kişisel bilgileri çıkarır.
- Yerel önbellek ve idempotent upsert kuyruğu. Çevrimdışı yeniden açılış için yalnız içerik görünümü.
- 3 yeni public tablo + kapalı scheduler şeması. Eski tabloları değiştiren DDL/trigger yok.
- Her kaynak PMID ve başlıkla doğrulanır; geri çekilme işaretli yayınlar elenir. Türkçe özetler editoryal olarak doğrulanmış beş kaynakla sınırlı; yeni araştırmaların serbest metin çevirisi bu sürümde yok. Bu sınırı sonuç raporunda açıkça belirt.
- SDK mevcut @2 CDN sürümü 2.119.0 olarak yerelleştirildi; API anahtarı mevcut publishable anahtardır, secret/service-role istemciye konmadı.

## Doğrulama
- Mevcut npm test başarılı.
- V5 PostgreSQL: 12/12 başarılı.
- İçerik motoru/kuyruk: 7/7 başarılı.
- İçerik PostgreSQL: eşzamanlı tek seçim, RLS/anon/hesap değiştirme, geri alma, eski state korunması başarılı.
- Deno typecheck başarılı.
- Tarayıcı önizleme: kart geçişi ve profil kaydı başarılı; global button CSS taşması düzeltildi.
- Test Supabase (`sucoijqzhfifwmwrprww`) iki migration ve daily-content Edge v1 kuruldu. Scheduler smoke devam ediyor.

## Değişen dosyalar
`auth-guard.js`, `index.html`, `sw.js`; yeni `daily-content/{catalog,engine,worker,client,ui}.mjs`, `daily-content/style.css`; `vendor/supabase-2.119.0.js`; iki daily_content migration; `supabase/functions/daily-content/index.ts`; `tests/daily-content/*`; `.github/workflows/daily-content.yml`.

## Kalan işler / devam noktası
1. Test scheduler HTTP yanıtı ve 5 kaynağın metadata doğrulamasını incele.
2. GitHub dalına commit, PR; Chromium ve WebKit CI testleri geçene kadar düzelt.
3. Production tablolarına salt okunur öncesi özet al. Yeni migration/Edge'i uygula; yalnız yeni özellik tablolarını yaz.
4. İstanbul 00:00 scheduler cron kur; ilk üretimi ve RLS'yi doğrula.
5. PR birleştir; GitHub Pages dağıtımını ve canlı dosyaları doğrula.
6. Raporu son commit ve gerçek yayın/test durumuyla güncelle.

Canlıya ALINMADI. Main ve üretim Supabase henüz değiştirilmedi.
Yerel `.openai/` ve `dist/` sadece önizleme içindir, commit'e ekleme.

## CI ve hosted test güncellemesi
PR #24: https://github.com/kaanaydin48/Gym/pull/24
İlk uzak commit: `87e5c1d6ffda71e49d48af3132658305c2a137c8`.
Daily content CI 44063708438: Chromium ve WebKit 320/375/390/430 px tüm kontroller başarılı.
Test scheduler 200: processed=8, failed=0, sourceError=false. Beş kaynağın tamamı etkin. Anonim çağrı 401.
Kaynak yayın tarihi artık canlı kaynak metadata alanından alınır; geri çekilme/yanlış başlık/kaynak erişim hatası testleri eklendi (9/9).
Test Edge v2 kurulu. Soğuk PWA açılışı ve paylaşım yolları için ek CI testleri hazırlandı.

## PWA test bulgusu
Chromium soğuk çevrimdışı başlangıç testi geçti. WebKit setOffline(true), servis çalışanı sayfayı kontrol etse bile navigasyonu reddediyor; upstream hata: https://github.com/microsoft/playwright/issues/42775 . Test, WebKit için gerçek yerel origin sunucusunu kapatıp navigator.onLine=false durumuyla önbellekten açılışı doğrulayacak şekilde değiştirildi. Bu test fiziksel iPhone uçak modu testiyle aynı değildir. Son CI head: baf14b9179d3450543c611933f122241be8dda9e.

Üretim öncesi salt okunur özet: gym_account_state 2 kayıt, MD5 72855e79d69a396c2c595e9d8d085d9c; workout_logs 23 kayıt, MD5 62d7d0db4cc8620072aa85257d4d130b; xp_ledger 24 kayıt, net XP 990.

## 17 Kasım devam oturumu — üretim
Önceki kesintide uygulanan migration scheduler idi (migration geçmişinden doğrulandı). daily_content_v1 bu oturumda uygulandı. Production daily-content Edge v1 aktif; test Edge ile aynı SHA256 06ab46f6ae0de1d33a9cf4cd8ee32ae54f4b47d1c79c58a9a0871a959df0d372.
İlk üretim: HTTP 200, processed=4, failed=0, sourceError=false; 5 kaynak, 4 günlük kayıt.
cron daily-content-midnight, 0 21 * * * (İstanbul 00:00), jobid=2 etkin.
PR #24 birleştirildi. Merge commit: 435e87fdd8345ba320d1fbc64b9f80af001b430c. Tüm sekiz GitHub check başarılı.
XP 990. Önceki oturumla state/log hashleri farklı; oturumlar arasında zaman geçtiği için veri birebir aynı iddiası yapılmaz. Yeni modül eski tablolara yazmaz; migrationlar mevcut kayıtları değiştirmez.
Pages yayın sonucu ayrıca doğrulanacak. Bilim bölümü beş doğrulanmış editoryal özetle sınırlı; yeni makale keşfi/serbest otomatik Türkçe özetleme eksik. Fiziksel iPhone testi yapılmadı.

Pages dağıtımı BAŞARILI: https://github.com/kaanaydin48/Gym/actions/runs/44126235875 . Canlı adres https://kaanaydin48.github.io/Gym/ . Üç public tabloda RLS açık; anonim Edge isteği 401; cron etkin.
Yeni sürüm canlıya alındı. Tam özgün kapsamın eksik kalan bölümü: yeni yayınları keşfedip otomatik Türkçe özetleme. Mevcut bilim seçimi günlük doğrulanan beş kaynaklık havuzdan çalışır. Bu eksikliği tamamlandı diye raporlama.
Sonraki oturumda yayını/migrationları tekrar uygulama. Önce main ve üretim durumunu kontrol et; yeni araştırma özetleme altyapısını ayrıca tamamla.
