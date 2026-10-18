# Üyelik kurulumunun tamamlanması

Canlı uygulama Supabase Auth ile admin, coach ve member rollerini doğrular. Antrenmanlar, kullanıcı Kaydet düğmesine bastığında save_gym_state RPC ile workout_logs ve gym_account_state tablolarına atomik yazılır. Yerel kopya başarısız ağ isteklerinde yeniden deneme için tutulur. cloud-sync.sql ve trigger-permissions.sql bu projeye 18 Ekim 2026 tarihinde uygulanmıştır. Eski `gym-tracker-pro-v1` kaydı silinmez; yönetici Hesabım ekranından önizlemeli birleştirme yapabilir.

## Gerekli sunucu kurulumu
1. Mevcut `profiles` tablosunda `id` (auth.users UUID) ve `role` alanlarını doğrula. RLS açık olmalı. Kullanıcı kendi rolünü okuyabilmeli, rolünü değiştirememeli. Authenticated/anon istemcilere rol yazma izni verme. Mevcut politikaları incelemeden toplu değiştirme.
2. `functions/invite-member/index.ts` dosyasını `invite-member` adıyla dağıt. Fonksiyon her istekte gerçek kullanıcı JWT'sini Auth sunucusuyla doğrular ve profiles üzerinden admin rolü arar. Service-role anahtarı yalnızca sunucudaki yerleşik ortam değişkeninden okunur.
3. Supabase Auth'da herkese açık kayıt kapalı olmalı. Yönlendirme izinlerine `https://kaanaydin48.github.io/Gym/login.html` ekle. SMTP/e-posta gönderimini yapılandır.
4. Yönetici ile Hesabım > Üye yönetimi ekranını aç. Kullanıcının belirlediği test e-postasına davet gönder. E-postadan kaydı tamamla, giriş ve çıkışı doğrula.
5. Üye ve koç JWT'leriyle liste/davet isteklerinin 403 döndüğünü, anonim isteğin 401 döndüğünü doğrula. Aynı cihazdaki iki ayrı hesabın yerel kayıtlarının karışmadığını doğrula.

Koçlara üye listesinin tamamı açılmaz. Atanmış koç ilişkisi, program atama ve antrenman bulut erişimi ayrıca sunucu politikalarıyla uygulanmalıdır.

## Yayın kontrolü
Sunucu fonksiyonu dağıtılmadan üye listesi ve davet formu açık bir servis bağlantı hatası gösterir. Form varlığı uçtan uca çalışan üyelik olarak değerlendirilmemelidir.
