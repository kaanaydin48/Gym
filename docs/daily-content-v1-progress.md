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
