# Gym Tracker Pro V3

## Mevcut kayıtlar
- `app.js` içindeki eski `gym-tracker-v1` localStorage anahtarı değiştirilmedi.
- Aynı GitHub Pages adresi, aynı tarayıcı profili ve aynı PWA kurulumu korunursa eski antrenman kayıtları okunur.
- Yüklemeden önce uygulama Ayarlar > JSON yedeği indir ile mutlaka yedek alın.
- Yeni koç taslakları `gym-tracker-pro-v3-coach` anahtarında saklanır.
- Şimdilik kişisel kayıtlar otomatik olarak buluta aktarılmaz.

## V3 yerel özellikler
- Koç sekmesi: üye taslağı, hareketli program şablonu, üyeye atama, JSON yedekleme.
- Mevcut takvim, üçlü split, set kaydı, dinlenme sayacı, hacim grafiği ve yedekleme korunur.
- Bu sürümde uzaktaki üyelerin gerçek hesapları ve canlı takip henüz arayüze bağlanmamıştır.

## iPhone ile yayınlama
1. Eski uygulamadan JSON yedeğini al.
2. `index.html`, `app.js`, `coach.js`, `sw.js`, `manifest.webmanifest`, `icon.png`, `icon-512.png` dosyalarını GitHub deponun ana klasörüne yükle. `supabase` ve bu README isteğe bağlıdır.
3. GitHub Pages dağıtımını bekle, uygulamayı kapatıp yeniden aç. Gerekirse Safari'den güncel sayfayı aç.
4. Koç sekmesinden yerel taslakları test et.

## Çok kullanıcılı altyapı (sonraki entegrasyon adımı)
1. Supabase projesi oluştur.
2. Authentication ayarlarında herkese açık self-signup'ı kapat. Sadece yönetici daveti kullanılacak.
3. `supabase/schema.sql` dosyasını SQL Editor'da çalıştır.
4. Supabase Auth panelinden ilk yönetici hesabını oluştur. SQL dosyasının sonundaki örnek komutla o kullanıcının UUID'sine `admin` rolü ver. Başka kullanıcılara admin rolü verme.
5. `supabase/functions/invite-member/index.ts` dosyasını Supabase Edge Functions olarak `invite-member` adıyla dağıt. JWT doğrulamasını etkin tut. `APP_URL` ortam değişkenini yayımlanan PWA URL'si yap.
6. Supabase e-posta şablonu, yönlendirme URL'si, SMTP gönderimi ve davet akışını test et.
7. **Henüz yapılacak:** İstemci oturum açma, davet kabul ekranı, bulut program CRUD, üye ekranı ve kayıt senkronizasyonu. Bunlar V3 paketinde çalışıyor gibi sunulmamalıdır.

## Güvenlik
- Service-role key veya yönetici parolası GitHub'a, HTML'e veya JavaScript'e konmaz.
- Tüm tablolar için RLS politikaları tanımlıdır. Gerçek kullanım öncesi farklı hesaplarla erişim testleri yapılmalıdır.
- Sporcuların sağlık/sakatlık notları hassas olabilir; gereksiz sağlık verisi toplamaktan kaçının.
