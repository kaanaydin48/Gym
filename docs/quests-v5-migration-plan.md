# V5 güvenli geçiş planı

10 Kasım 2026. Üretimde yalnız salt okunur inceleme yapıldı. Dal: codex/quests-v5.

## İncelenen yapı

Antrenman kaynağı gym_account_state.state.days; workout_logs ayrı eski kayıt tablosudur. Mevcut ortak workout-metrics.js geçerli set doğrulamasını sağlar. Kas alanı muscle; Ön kol ve Arka kol, Kol olarak birleşir. V4 XP defteri append-only, hesap işleme satır kilidiyle seri çalışır. user_quests haftalık slot sınırı dört; altı görev için migration gerekir.

## Geçiş

1. Test ortamında mevcut migration üzerine V5 migration uygulanır. Üretim antrenmanları test ortamına kopyalanmaz.
2. Yeni nullable v5_start/v5_baseline alanları ve RLS korumalı, değiştirilemez V5 günlük hedef tablosu eklenir. Mevcut antrenman, profil, ledger, rozet ve grafik verisi silinmez veya yeniden yazılmaz.
3. Aktivasyon sonraki Türkiye pazartesi 00:00 sınırıdır; haftalık slot çakışması önlenir. V5 worker bu tarihten önce V4 davranışını sürdürür.
4. İlk V5 işlemi hesap kilidi altında mevcut ledger toplamını ve kazanılmış rozet/unvanları sabitler. Önceki ledger anahtarlarına ters kayıt üretilmez. Yeni anahtarlar v5: öneki kullanır.
5. Günlük hedefler gün başlangıcında sunucunun gördüğü son 28 günlük kayıtla sabitlenir. Üçten az tamamlanmış antrenmanda 8/16; aksi halde medyanın yarısı temel (4–16), tamamı ileri (temelden büyük, en fazla 32). Hedefler XP için bir eşiktir, antrenman reçetesi değildir.
6. Dinlenme yalnız gün başlamadan sunucuda planlanmışsa ve gün boyunca antrenman başlatma/set/tamamlama olayı yoksa, gün bittikten sonra 15 XP; haftada ilk üç uygun gün. Kayıt silmek antrenman olayını saklamaz. Dinlenme devamlılığa katkı sağlamaz.
7. Haftalık görevler o haftanın tamamlanmış geçerli setlerini sayar. Ödül tarihi hedefe ulaşılan gün; günlük, haftalık ve rekor ödülleri aynı 250 XP sınırına tabidir. Düzeltmeler yalnız V5 ödüllerine telafi kaydı ekler.
8. V5 hesapları için mesaj/kanıt/onay/manuel hedef RPC erişimi sunucuda reddedilir; eski geçmiş korunur. Arayüz sunucunun ruleVersion değerine göre V5 görünümüne geçer.

## Yayın sırası ve geri dönüş

Önce test migration + worker + Auth/RLS/paralellik testleri; sonra üretim yedeği ve veri digest kontrolü; ardından migration, iki Edge worker ve istemci yayını. Aktivasyondan sonra V4 worker'a geri dönülmez: tüm geçmişi yeniden hesaplayarak V5 XP'yi geri alabilir. Sorunda scheduler/refresh durdurulur, antrenman kaydı çalışmaya devam eder; V5 düzeltmesi ileri yönlü uygulanır. Geçiş öncesi migration alanları bırakılarak v5_start null yapılabilir; ledger geçmişi silinmez.

## Yayın engeli

Kullanıcı canlı Supabase müdahalesini açıkça yasakladı. Bu sınır altında migration/Edge dağıtımı yapılmayacak. Yalnız istemciyi V5 olarak yayınlamak güvenli otomatik doğrulamayı sağlamaz; tam V5 yayını bu nedenle engellidir.
