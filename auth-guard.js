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

    const header = document.querySelector("header");
    if (header) {
      const logoutButton = document.createElement("button");
      logoutButton.type = "button";
      logoutButton.className = "secondary";
      logoutButton.textContent = "Çıkış Yap";
      logoutButton.style.fontSize = "12px";
      logoutButton.style.padding = "9px 11px";

      const saveStatus = document.getElementById("saveStatus");
      if (saveStatus) {
        const actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.alignItems = "center";
        actions.style.gap = "8px";
        actions.append(saveStatus, logoutButton);
        header.appendChild(actions);
      } else {
        header.appendChild(logoutButton);
      }

      logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;
        logoutButton.textContent = "Çıkılıyor...";
        const { error: signOutError } = await client.auth.signOut();
        if (signOutError) {
          alert("Çıkış yapılamadı: " + signOutError.message);
          logoutButton.disabled = false;
          logoutButton.textContent = "Çıkış Yap";
          return;
        }
        window.location.replace(LOGIN_PAGE);
      });
    }

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
