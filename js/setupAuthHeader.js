function setupAuthHeader() {
  const authSection = document.getElementById('auth-section');
  if (!authSection) return;

  fetch('/api/me', { credentials: 'include' })
    .then(res => {
      if (!res.ok) throw new Error('Not logged in');
      return res.json();
    })
    .then(data => {
      authSection.innerHTML = `
        <div class="dropdown" style="display:inline-block; position: relative;">
          <a href="account.html"><i class="fa fa-user"></i> ${data.email.split('@')[0]}</a>
          <ul style="position:absolute;top:24px;right:0;background:#fff;border:1px solid #ccc;list-style:none;padding:10px;width:140px;display:none;z-index:999;">
            <li><a href="account.html">My Account</a></li>
            <li><a href="#" onclick="logout()">Logout</a></li>
          </ul>
        </div>
      `;
      const dropdown = authSection.querySelector('.dropdown');
      const menu = dropdown.querySelector('ul');
      dropdown.addEventListener('mouseenter', () => { menu.style.display = 'block'; });
      dropdown.addEventListener('mouseleave', () => { menu.style.display = 'none'; });
    })
    .catch(() => {
      authSection.innerHTML = `<a href="login.html"><i class="fa fa-user"></i> Login / Register</a>`;
    });
}

function logout() {
  fetch('/api/logout', { credentials: 'include' })
    .then(() => {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach(c => {
        document.cookie = c.trim().split("=")[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
      });
      window.location.replace("login.html");
    });
}
