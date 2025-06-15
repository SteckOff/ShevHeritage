// Загружает товары и рендерит
fetch('/api/products')
  .then(res => res.json())
  .then(products => {
    const container = document.getElementById('product-list');
    products.forEach(p => {
      const col = document.createElement('div');
      col.className = 'col-lg-4 col-md-6 col-sm-6 mix '+p.category;
      col.innerHTML = `
        <div class="product__item">
          <div class="product__item__pic set-bg" data-setbg="${p.image}"></div>
          <div class="product__item__text">
            <h6><a href="shop-details.html?id=${p.id}">${p.name}</a></h6>
            <h5>$${p.price.toFixed(2)}${p.discount>0?` <span>$${(p.price*(1+ p.discount/100)).toFixed(2)}</span>`:''}</h5>
          </div>
        </div>`;
      container.appendChild(col);
    });
    // Инициализировать mixitup и owl.carousel
    mixitup('.product__discount__slider .row');
    mixitup('#product-list', { selectors: { target: '.mix' } });
    document.querySelectorAll('.set-bg').forEach(el => el.style.backgroundImage = `url(${el.dataset.setbg})`);
  });