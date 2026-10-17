/* Gym Tracker Pro - Supabase yönetici oturum kontrolü */
(async function () {
  "use strict";

  // Paneli yalnızca oturum ve rol doğrulandıktan sonra göster.
  document.documentElement.style.visibility = "hidden";

  const SUPABASE_URL = "https://aryzgrgjwjdxumbddank.supabase.co";
  // Bu, login.html'de kullanılan PUBLIC (publishable) anahtardır.
  // Secret/service_role anahtarını asla tarayıcı koduna eklemeyin.
  const SUPABASE_KEY = "sb_publishable_t2QNhjaGq0_kaY5IfsF87A_y7ep-837";
  const LOGIN_PAGE = "./login.html";

  function loadScript(filename) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = filename;
      script.onload = resolve;
      script.onerror = () => reject(new Error(filename + " yüklenemedi"));
      document.body.appendChild(script);
    });
  }

  try {
    if (!window.supabase) {
      throw new Error("Supabase kütüphanesi yüklenemedi");
    }

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await client.auth.getUser();
    if (error || !data?.user) {
      window.location.replace(LOGIN_PAGE);
      return;
    }

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError) throw profileError;
    if (profile?.role !== "admin") {
      window.location.replace(LOGIN_PAGE);
      return;
    }

    // Mevcut uygulama dosyaları yalnızca doğrulanmış yönetici için başlatılır.
    await loadScript("./coach.js");
    await loadScript("./app.js");

    // Hesap bilgilerini ve çıkış butonunu yalnızca Yedekleme sekmesinde göster.
    // app.js, sekme her açıldığında settings.innerHTML içeriğini yeniden oluşturur.
    // Bu yüzden kartı her yeniden çizimden sonra güvenli biçimde geri ekliyoruz.
    const settingsSection = document.getElementById("settings");
    if (!settingsSection) throw new Error("Yedekleme sekmesi bulunamadı");

    function addAccountCard() {
      if (document.getElementById("gym-account-card")) return;
      if (!settingsSection.querySelector(".card")) return;

      const card = document.createElement("div");
      card.id = "gym-account-card";
      card.className = "card";

      const title = document.createElement("h2");
      title.textContent = "Kullanıcı bilgileri";

      const emailLabel = document.createElement("label");
      emailLabel.textContent = "E-posta";
      const email = document.createElement("p");
      email.style.cssText = "margin:5px 0 15px;overflow-wrap:anywhere;font-weight:600";
      email.textContent = data.user.email || "E-posta bilgisi yok";

      const roleLabel = document.createElement("label");
      roleLabel.textContent = "Hesap türü";
      const role = document.createElement("p");
      role.style.cssText = "margin:5px 0 16px;font-weight:600";
      role.textContent = profile.role === "admin" ? "Yönetici" : "Üye";

      const logoutButton = document.createElement("button");
      logoutButton.type = "button";
      logoutButton.className = "danger";
      logoutButton.textContent = "Çıkış Yap";
      logoutButton.style.width = "100%";

      logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;
        logoutButton.textContent = "Çıkılıyor...";
        try {
          const { error: signOutError } = await client.auth.signOut();
          if (signOutError) throw signOutError;
          // Yerel antrenman kayıtları silinmez.
          window.location.replace(LOGIN_PAGE);
        } catch (error) {
          alert("Çıkış yapılamadı: " + error.message);
          logoutButton.disabled = false;
          logoutButton.textContent = "Çıkış Yap";
        }
      });

      card.append(title, emailLabel, email, roleLabel, role, logoutButton);
      settingsSection.prepend(card);
    }

    const settingsObserver = new MutationObserver(addAccountCard);
    settingsObserver.observe(settingsSection, { childList: true });
    addAccountCard();

    document.documentElement.style.visibility = "visible";
  } catch (error) {
    console.error("Gym Tracker başlatma hatası:", error);
    document.body.replaceChildren();
    const main = document.createElement("main");
    main.style.cssText = "padding:30px;font-family:sans-serif";
    const heading = document.createElement("h2");
    heading.textContent = "Uygulama başlatılamadı";
    const message = document.createElement("p");
    message.textContent = "Bağlantını kontrol edip tekrar dene.";
    const retry = document.createElement("button");
    retry.textContent = "Tekrar dene";
    retry.onclick = () => window.location.reload();
    main.append(heading, message, retry);
    document.body.appendChild(main);
    document.documentElement.style.visibility = "visible";
  }
})();
