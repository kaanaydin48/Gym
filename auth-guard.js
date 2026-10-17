
(async function () {
  const SUPABASE_URL =
    "https://aryzgrgjwjdxumbddank.supabase.co";

  // login.html içindeki Publishable Key değerini
  // buraya da aynı şekilde yaz.
  const SUPABASE_KEY = "BURAYA_PUBLISHABLE_KEY";

  document.documentElement.style.visibility = "hidden";

  try {
    const client = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

    const { data, error } = await client.auth.getUser();

    if (error || !data.user) {
      window.location.replace("./login.html");
      return;
    }

    const { data: profile, error: profileError } =
      await client
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

    if (profileError || profile?.role !== "admin") {
      window.location.replace("./login.html");
      return;
    }

    document.documentElement.style.visibility = "visible";

  } catch (error) {
    console.error("Oturum kontrolü:", error);
    window.location.replace("./login.html");
  }
})();
