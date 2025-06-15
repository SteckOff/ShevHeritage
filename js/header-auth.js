document.addEventListener("DOMContentLoaded", async () => {
  const authSection = document.getElementById("auth-section");
  if (!authSection) return;

  try {
    const res = await fetch("/api/me", { credentials: "include" });
    if (res.ok) {
      const user = await res.json();
      authSection.innerHTML = `
        <a href="account.html"><i class="fa fa-user"></i> ${user.fullName || user.email.split('@')[0]}</a>
      `;
    } else {
      authSection.innerHTML = `
        <a href="login.html"><i class="fa fa-user"></i> Login / Register</a>
      `;
    }
  } catch (err) {
    console.error("Auth check failed", err);
  }
});
