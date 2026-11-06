# Gym Trader Pro — Sistem denetimi ilerlemesi

## Durum ve devam noktası

**Denetim tamamlanmadı. Üretime yayın yapılmadı.** Bu belge bir ara sonuç ve devam kaydıdır; tam uçtan uca başarı raporu değildir.

- Başlangıç: 6 Kasım 2026 talebi; kaynak tabanı `eb9463c54285d3e502250970a6a0e6a5a2806c0a`.
- Çalışma branch'i: `audit/system-2026-11-06`.
- Kalıcı kaynak yedeği: `backup/pre-system-audit-2026-11-06`, aynı başlangıç commit'i.
- Ek yerel Git bundle oluşturuldu ve `git bundle verify` geçti. Bundle geçici çalışma alanında; kalıcı kaynak yedeği GitHub branch'idir. Veritabanı yedeği değildir.
- Canlı Supabase üzerinde yalnızca SELECT, şema/politika/fonksiyon/yetki ve advisor incelemeleri yapıldı. Hesap, kayıt, yetki veya şema değiştirilmedi. E-posta gönderilmedi.
- Test projesi pasif. Yeniden açılmadı; ücretli yeni ortam oluşturulmadı.
- Devam ederken önce bu belgeyi, `git status`, branch ve `git log` sonuçlarını kontrol et. Geçen testleri sadece yeni değişiklik gerektirirse tekrarla.

## Tamamlanan güvenli düzeltmeler

| Kimlik | Öncelik | Yeniden üretim / temel neden | Düzeltme | Doğrulama |
|---|---|---|---|---|
| SYNC-01 | P0 | Gönderim sürerken yeni düzenleme yapılması; eski isteğin cevabı yerel pending bayrağını false yapıyordu. Yeniden açılış buluttaki eski sürümü seçebiliyordu. | Cevap yalnızca gönderilen snapshot'ı onaylar; güncel state cihazda saklanır ve yeni düzenlemeler pending kalır. | Yeni regresyon testi önce başarısız oldu, sonra geçti. |
| SYNC-02 | P1 | initializeCloud bulut verisini yalnızca belleğe alıyordu. Temiz cihazda sonraki çevrimdışı açılış için kopya yoktu. | Buluttan yükleme cihaz kopyasını ve temiz revizyon bilgisini günceller. | Cihaz storage içeriği bağımsız doğrulandı. Bu, offline Auth açılışının çözüldüğü anlamına gelmez. |
| SYNC-03 | P1 | Çevrimdışı açılışta dirty false başlıyor, kalıcı pending bilgisi okunmuyordu. | Başlangıçta pending ve taban revizyonunu yükle. | Offline yeniden başlatma testi. |
| SYNC-04 | P1 | Bağlantı dönüşü tetikleyicisi yok; değişmemiş bulut tabanı bile elle birleştirme gerektiriyordu. | online tetikleyicisi; yalnızca aynı taban revizyonunda güvenli otomatik yeniden deneme. Farklı tabanlar açık birleştirme gerektirir. | Offline/online ve iki cihaz simülasyonu. |
| SYNC-05 | P1 | Başarısız kayıt sürekli 1,8 saniyede yeniden deneniyordu. | Başarısızlıkta 60 saniyeye kadar artan bekleme; revizyon çakışmasında yazmayı durdur. | Çakışmada cloudReady false testi; gecikme hesabı kod incelemesi. Zamanlamanın gerçek ağ testi bekliyor. |
| SYNC-06 | P1 | Çakışmada görülen uzak revizyonun, yerel düzenlemenin taban revizyonuyla karışma riski. | localBaseRevision ayrı tutulur; yalnızca doğrulanmış kayıt/yükleme veya açık birleştirme ile ilerler. Eşzamanlı cloud initialize çağrıları engellenir. | Çakışma → yeni düzenleme → yeniden açılış → engelin korunması testi. |
| TEST-01 | P2 | Eski DOM taklitleri eksik, eski Gelişim menüsü ve otomatik antrenman başlangıcı beklentileri güncel tasarımla uyuşmuyordu. | DOM mock'ları, ikon yükleme, başlangıç ve kütüphane beklentileri güncellendi; testler kaldırılmadı. | Dokuz paket geçti. |

Tasarım, grafik renkleri, hareket kutuları, program içerikleri ve geçmiş kayıt formatı değiştirilmedi. Supabase RPC veya şema değişikliği yapılmadı.

## Çalıştırılan testler

`node tests/run-unit.cjs` — **9/9 paket geçti**, TZ=Europe/Istanbul. Node VM, sahte DOM ve sahte Supabase kullanılır; tarayıcı veya gerçek veritabanı entegrasyonu değildir.

| Paket | Kapsam |
|---|---|
| audit | Navigasyon, set değerleri, hacim, kaydetme/okuma, ikinci cihaz, çakışma, offline yeniden deneme, RIR doğrulama, bitirme, dinlenme/silme, program/şablon, sayaç, ölçüm, inline handler sözdizimi |
| beginner-program | Varsayılan program, atanmış program, üye filtreleri ve düzenleme engelleri, program notları, geçmişin korunması |
| growth | Ay/yıl sınırları, tamamlanmamış setlerin dışlanması, PR ve veri değişmezliği |
| home-flow-groups | Altı kas grubu sırası, filtreler, hacim toplamı, yüzdelerin paydası, boş gruplar ve özel hareketler |
| home-insights | Son biten antrenman, dinlenme günleri, geçmiş seçimi, tarih filtreleri, adlar, yeni kayıt ve silme |
| member-directory | Türkçe arama, filtre, HTML kaçış, geç gelen yanıt, boş/hatalı sonuç, rol koruması |
| pwa-dock-unit | iOS/standalone ayrımı, scroll ve klavye konum hesapları, yön değişimi ve dönüş — yalnızca simülasyon |
| summary-flow | İki özet, hacme orantılı/boş kavis, seçim, klavye handler'ları, kayıtların korunması |
| sync-safety | İstek sırasındaki düzenleme, yeniden açılış, cihaz kopyası, offline pending, bağlantı dönüşü, stale revision, açık birleştirme, depolama hatası |

`node --check app.js` ve `git diff --check` geçti.

Tarayıcı testleri **başarısız/engelli**, başarılı sayılmadı:
- `tests/home-flow-layout.cjs`: Chromium başlatma socket izni hatası (`Operation not permitted`).
- `tests/pwa-dock.cjs`: WebKit sistem kütüphaneleri eksik.
- Gerçek kullanıcı tıklamalarıyla tam uygulama akışı çalıştırılamadı. iPhone ekran kilidi, gerçek Safari/PWA ve klavye test edilmedi.

Performans deneyi: 10.000 sentetik antrenman günü, Node/Map depolamasında `save()` yaklaşık 242 ms; JSON yaklaşık 25.041.844 karakter. Bu gerçek cihaz ölçümü değildir. Her girdide bütün geçmişi serileştirme ve localStorage kotası büyük geçmişlerde önemli kalan risktir. Kullanıcı verisi kullanılmadı.

## Canlı Supabase: yalnızca okuma bulguları

- Altı public tabloda RLS açık.
- Snapshot sahibi `auth.uid()` ile kısıtlanıyor; log insert/update politikalarında kayıt sahibi ve assignment sahipliği kontrolü var.
- `save_gym_state` SECURITY INVOKER, sabit search_path, satır kilidi ve expected_revision kontrolü kullanıyor. Doğrudan anonim çalıştırma verilmemiş.
- Mevcut snapshot günleri ile workout_logs karşılaştırması: **0 eksik log, 0 snapshot dışı log, 0 içerik uyumsuzluğu**. Sadece toplamlar okundu; kişisel kayıtlar rapora alınmadı.
- Canlı fonksiyondaki tarih regex'i SELECT ile değerlendirildi: geçerli `2026-11-06` tarihi kabul ediliyor.
- Dört migration kaydı görüldü. Bu, tam şema yedeği veya geri yükleme deneyi değildir.

### Açık güvenlik ve erişim bulguları

1. **P0 inceleme / yayın engeli:** `gym_account_state` üzerinde anon ve authenticated; `coach_program_assignments` üzerinde authenticated için TRUNCATE (ayrıca REFERENCES/TRIGGER) yetkileri mevcut. TRUNCATE satır politikalarıyla korunmaz. Bu denetimde herhangi bir TRUNCATE veya saldırı denemesi yapılmadı; REST üzerinden sömürülebilirlik kanıtlanmadı. En az yetki için kaldırılmalı; SQL taslağı raporda, canlıda uygulanmadı.
2. **P1:** `is_coach_of` yalnızca `admin` rolünü kabul ediyor. Koç rolüne çevrilen hesapların yetkili üyelerine erişimi bu kuralla engelleniyor. Üye yönetim ekranı/Edge Function da admin ile sınırlı. Güvenli düzeltme; koç ilişkisi, program sahipliği ve atanmış üye testleriyle izole DB'de hazırlanmalı. Sadece koşula coach eklemek yeterli doğrulama değildir.
3. `gym_account_state` ve workout_logs için doğrudan owner INSERT/UPDATE izinleri RPC dışında değişikliği mümkün kılıyor. RLS başka kullanıcıyı korusa da owner'ın iki veri görünümünü ayırması mümkün; DB bütünlüğü için ayrıca incelenmeli.
4. Advisor: leaked-password protection kapalı. `is_admin`/`is_coach_of` authenticated tarafından çağrılabilir SECURITY DEFINER helper'ları; sabit search_path ve auth.uid kontrolü var. Uyarı tek başına veri sızıntısı kanıtı değil.
5. Performans advisor: 6 indekslenmemiş foreign key, 1 kullanılmamış indeks, assignment SELECT için birden fazla permissive politika. İndeksler körlemesine eklenmedi/silinmedi.
6. CDN'deki Supabase tarayıcı bağımlılığı yalnızca ana sürüme (`@2`) bağlı; kilitli sürüm ve bağımlılık güvenlik taraması henüz yapılmadı.

### Canlıya uygulanmamış yetki daraltma taslağı

Önce izole ortam, backup doğrulaması ve rol regresyonu; sonra açık üretim onayı gerekir. Bu blok mevcut çalışma sırasında çalıştırılmadı.

```sql
REVOKE TRUNCATE, REFERENCES, TRIGGER
ON public.gym_account_state, public.coach_program_assignments
FROM anon, authenticated;
```

Üretim backup/PITR kullanılabilirliği ve geri yüklenebilirliği bu araçlarla doğrulanmadı. Şema veya yetki değişikliğinden önce dashboard backup tarihi/retention ve test restore sonucu alınmalı. Kaynak kodu yedeği veritabanı yedeği yerine geçmez.

## Kalan kapsam ve yayın engelleri

| Modül/senaryo | Durum / kalan iş |
|---|---|
| Gerçek DB yazma, rollback ve RLS izolasyonu | Test DB pasif. Bu oturumda gerçek DB entegrasyon testi yapılmadı; eski tests/AUDIT.md sonuçları bu oturumun sonucu sayılmadı. |
| Auth, davet, reset, admin/koç/üye girişleri | Kaynak/politika incelemesi var; üç gerçek test hesabıyla akış ve e-posta teslimi doğrulanmadı. |
| Hesap değişimi / çoklu sekme | Ana kayıt ve sayaç anahtarları kullanıcıya özel. Oturum değişirken devam eden ağ istekleri ve farklı hesapla TOKEN_REFRESH/SIGNED_IN olayları uçtan uca test edilmeli. |
| Offline yeniden açılış | Verinin cihazda korunması test edildi; auth-guard `getUser()` ve profil ağ sorgusu nedeniyle tam offline açılış hâlâ engellenebilir. Güvenliği gevşetmeden oturum tasarımı gerekir. |
| PWA/cache | Depoda sw.js var fakat güncel HTML/JS içinde serviceWorker.register çağrısı bulunamadı. Önceden kayıtlı worker cihazda kalabilir. Cache listesi sürümlü dosyalarla tam eşleşmiyor; aktivasyonda origin'deki tüm farklı cache'leri siliyor. Güncelleme/kayıt kurtarma gerçek browser testini bekliyor. |
| Takvim/gece yarısı | `today` uygulama açılışında sabit; gün değişiminde yenilenmiyor. Otomatik dinlenme ilk antrenman yerine ay başından başlıyor. Türkiye saat dilimiyle gerçek tarih geçişi ve davranış regresyonu gerekiyor. |
| Aynı gün çoklu antrenman | Gün anahtarlı state ve member/date unique index nedeniyle desteklenmiyor; ikinci kayıt ekleme sessizce mevcut günü koruyor. Veri modelini değiştirmek mevcut küçük düzeltme kapsamını aşar; kayıp olmadan kabul kriteri belirlenmeli. |
| Süperset / aktif harekete müdahale / duraklatma | Süperset etiketi ve program editörü var. Her istenen aktif-antrenman işleminin UI desteği/semantiği ayrı doğrulanmalı; bulunmayan özelliği çalışıyor sayma. |
| Hesaplamalar | Mevcut birim testleri geçti; tüm 1RM, streak, süre ve dinlenme istatistikleri bağımsız fixture matrisiyle tamamlanmadı. |
| Büyük geçmiş | Tüm snapshot her girdide yazılıyor, localStorage kotası riski var. IndexedDB/journal geçişi yapılmadı. Mevcut veri kaybına karşı kota uyarısı testi geçti. |
| Fiziksel iPhone | Safari ve ana ekran PWA: kilit, uygulama öldürme, klavye, yön değişimi, safe-area, offline→online, sürüm güncelleme testleri tamamen bekliyor. |

## Değişen dosyalar

- `app.js`: cihaz/bulut pending ve revizyon yönetimi, cloud hydration, online retry ve backoff.
- `tests/sync-harness.cjs`: izole VM ve fake Supabase altyapısı.
- `tests/sync-safety.cjs`: yeni kayıt güvenliği regresyonları.
- `tests/run-unit.cjs`: TZ=Europe/Istanbul ile dokuz paketi çalıştıran başarısızlık kodlu koşucu.
- `tests/audit.cjs`, `tests/beginner-program.cjs`, `tests/growth.cjs`, `tests/member-directory.cjs`: güncel uygulamaya uygun test altyapısı/beklentiler.
- `.github/workflows/member-directory-check.yml`: PR/manual CI'da bütün birim paketleri.
- `docs/system-audit-progress.md`: bu devam kaydı.

## Bir sonraki çalışma sırası

1. Bu branch ve commit durumunu kontrol et; dokuz geçen paketin sonucunu koru.
2. Kullanılabilir izole Postgres/Supabase ve tarayıcı ortamı sağla. Pasif test projesini kullanmadan önce maliyet/erişim durumunu doğrula; gerçek kullanıcı hesabı kullanma.
3. En yüksek öncelik: gereksiz DB yetkileri, koç izolasyonu, hesap değişimi yarışları; izole üç rol fixture'ı ile test et. Üretime uygulama.
4. Gerçek browser'da test hesaplarıyla ağ gecikmesi/kesinti, reload, iki context, RPC response kaybı, kota, auth yenileme testlerini çalıştır.
5. Tarih/dinlenme ve SW/cache sorunlarını yeniden üreten testlerle düzelt; tasarımı koru.
6. Kullanıcının bütün modül listesini tek tek geç/kal/engelli durumuyla tamamla. Fiziksel iPhone kanıtını ayrı tut.
7. DB backup/restore ve açık riskler kapanmadan yayın isteme. Son rapor tamamlandığında açık canlıya alma onayını bekle.
