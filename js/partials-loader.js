document.addEventListener("DOMContentLoaded", () => {
  Promise.all([
    fetch("header.html").then(res => res.text()).then(html => {
      document.getElementById("header-placeholder").innerHTML = html;
    }),
    fetch("footer.html").then(res => res.text()).then(html => {
      document.getElementById("footer-placeholder").innerHTML = html;
    })
  ]).then(() => {
    // Запускаем auth только после загрузки хедера
    const script = document.createElement('script');
    script.src = 'js/header-auth.js';
    document.body.appendChild(script);
  });
});
