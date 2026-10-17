# Gym Tracker Pro — Yerel test sürümü 1.0

Mobil uyumlu, Türkçe, kurulumsuz statik web uygulaması. Harici bağımlılık, API anahtarı veya sunucu bağlantısı içermez.

## iPhone ile kurulum

1. ZIP'i Dosyalar uygulamasına kaydet. Dosyaya dokunarak aç.
2. Mevcut Gym projenin üzerine yükleme. GitHub'da ayrı bir test deposu oluştur (ör. gym-tracker-test).
3. Depoda Add file → Upload files ile index.html, style.css ve app.js dosyalarını deponun köküne yükle. Dosyalar bir alt klasör içinde kalmamalı. README.md isteğe bağlıdır.
4. Settings → Pages bölümünde branch üzerinden yayınlama seçeneğini kullan. main dalını ve root klasörünü seçip kaydet. GitHub arayüzündeki adlar sürüme göre değişebilir.
5. GitHub'ın verdiği Pages adresini Safari'de aç. Paylaş → Ana Ekrana Ekle ile kısayol oluşturabilirsin.

iPhone Dosyalar önizlemesinden HTML açmak uygulamanın JavaScript'ini güvenilir şekilde çalıştırmaz. Safari'de bir web adresinden kullan. Bu paket yalnızca dosya teslimidir; canlıya yayınlanmadı.

## Bilgisayarda kullanım

Klasörde `python3 -m http.server 8080` çalıştır; tarayıcıda http://localhost:8080 adresini aç. Derleme veya npm kurulumu gerekmez.

## Çalışan özellikler

- Aylık takvim, tarih seçimi, program atama, ayrı mor renkte dinlenme günleri.
- Göğüs + Arka Kol, Sırt + Ön Kol, Omuz + Bacak programları. Sırt gününde ön kol hareketleri önce gelir. Bunlar düzenlenebilir başlangıç şablonlarıdır.
- Kg, tekrar, RIR ve tamamlandı set kayıtları. Antrenman başlat/bitir ve toplam süre. Dinlenme sayacı yoktur.
- Birden çok program, tek aktif seçim; program düzenleme, hareket sırası, alternatif hareket, süperset etiketi, çoğaltma ve eski sürümleri inceleme.
- Full Body, Upper, Lower, Push, Pull, Legs başlangıç şablonları.
- Hareket adı, kas ve ekipman filtreleri; özel hareket ekleme.
- Hareket ağırlık/tahmini 1RM grafiği, tarih filtresi, veri noktası detayları, önceki antrenman karşılaştırması, kas grubu set dağılımı, geçmiş ve vücut ağırlığı kayıtları.
- Açık/koyu/sistem teması, KG/LB dönüşümü, hafta başlangıcı, yerel profil.
- JSON yedeği indirme; içe aktarım önizlemesi, gün bazlı çakışma seçimi ve birleştirme. Birleştirmede mevcut profil/ayarlar korunur; aynı kimlikli programların cihazdaki sürümü korunur.

## Veri güvenliği ve sınırlar

Bu sürüm verileri localStorage'a kaydeder. Kayıtlar cihaz + tarayıcı + site adresine özeldir. Aynı anda birden çok sekmeden düzenleme yapma; sekmeler arası çakışma çözümü yoktur. Tarayıcı verilerini silmek, gizli sekme kullanmak veya site adresini değiştirmek kayıtların kaybına/görünmemesine yol açabilir. JSON yedeğini düzenli indir ve dosyanın gerçekten indiğini kontrol et.

Başlangıçta geçmiş antrenman verisi yoktur. 16 Ekim kayıtları eksik bağlamdan tahmin edilip eklenmedi. Yalnızca bu sürümün `schema: gym-tracker-pro, version: 1` yedeği alınır. Eski panelin version:3 JSON'u doğrudan alınmaz; önce hareket sırası ve ağırlık anlamı doğrulanarak ayrı dönüştürme gerekir.

Hacim: harici ağırlık ile vücut ağırlığı ayrı. Dambıl setinde tek eldeki kg × 2 × tekrar; diğer harici setlerde toplam kg × tekrar. Dips gibi hareketlerde kullanıcı toplam vücut + ek ağırlığı girer. Yardımlı hareketler için ayrı yardım alanı henüz yoktur. Plank gibi süre temelli hareketler bu tekrar tabanlı takipte kullanılmamalıdır.

Tahmini 1RM: harici ağırlık hareketlerinde tamamlanmış 1–10 tekrar setleri için Epley. RIR'a göre düzeltme yapılmaz; gerçek maksimum test değildir. PR grafiği seçilen dönem içindeki en yüksek değeri gösterir. Sıfır veri durumunda grafik üretilmez.

## Sonraki aşamada tamamlanacaklar

Bu ZIP, onaylanan kapsamın ilk Takvim + Antrenman + Programlar sürümüdür; sekiz aşamanın tümünün tamamlandığı anlamına gelmez.

- Supabase Auth, bulut senkronizasyonu, çevrimdışı kuyruk, cihazlar arası çakışma yönetimi.
- Admin/coach/member rolleri, RLS, sunucu daveti, üye arama/atama, özel koç notları, devir ve arşiv.
- Gerçek oturumlar, e-posta doğrulama, şifre sıfırlama, çıkış, profil fotoğrafı.
- Lisanslı ve doğrulanmış sessiz hareket animasyonları, teknik açıklamalar.
- Haftalık hacim/sıklık/süre/vücut ağırlığı grafikleri ve detaylı rekor ekranları.
- Çok günlük program gruplaması, ses/gizlilik tercihleri, yüklü uygulama için servis çalışanı ve tam çevrimdışı açılış.

Süperset şu anda program ve set ekranında bir gruplama etiketidir; otomatik sırayla yönlendirme yapmaz.

## Doğrulama

JavaScript sözdizimi kontrol edildi. DOM taklidiyle kayıt, dambıl hacmi, program anlık görüntüsü, KG/LB dönüşümü, bozuk yedek reddi, tekrar içe aktarımda çoğalmama, dinlenme kaydı, tüm ekranların HTML üretimi ve grafik üretimi test edildi. Gerçek tarayıcı/iPhone görsel ve etkileşim testi bu ortamda yapılamadı.

Canlı kullanımdan önce test: bir antrenman ata, bir set gir, sayfayı yenile, JSON yedeğini indir, başka test adresinde içeri al ve değerleri karşılaştır. Sonra iPhone'da takvim, klavye, modallar ve tema görünümünü kontrol et.
