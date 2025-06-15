// Инициализация корзины из localStorage или пустой массив
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Функция сохранения корзины
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Функция обновления счетчика корзины в header (обновляет все элементы с .header__cart span)
function updateCartCounter() {
  const counterElements = document.querySelectorAll('.header__cart span');
  let totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  counterElements.forEach(el => el.textContent = totalItems);
}

// Функция для отрисовки корзины на странице shopping-cart (если имеется таблица)
function renderCart() {
  const cartContainer = document.querySelector('.shoping__cart__table tbody');
  if (!cartContainer) return;
  cartContainer.innerHTML = '';
  cart.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="shoping__cart__item">
        <img class="cringe_img" src="img/cart/cart-${index+1}.jpg" alt="">
        <h5>${item.name} <br><small style="font-size: 14px;">Flavor: ${item.flavor}</small></h5>
      </td>
      <td class="shoping__cart__price">$${item.price.toFixed(2)}</td>
      <td class="shoping__cart__quantity">
        <div class="quantity">
          <div class="pro-qty">
            <input type="text" value="${item.quantity}" onchange="changeQuantity(${index}, this.value)">
          </div>
        </div>
      </td>
      <td class="shoping__cart__total">$${(item.price * item.quantity).toFixed(2)}</td>
      <td class="shoping__cart__item__close">
        <span class="icon_close" onclick="removeItem(${index})"></span>
      </td>
    `;
    cartContainer.appendChild(row);
  });
  updateTotals();
}

// Функция изменения количества товара в корзине
function changeQuantity(index, newQuantity) {
  cart[index].quantity = parseInt(newQuantity) || 1;
  saveCart();
  renderCart();
  updateCartCounter();
}

// Функция удаления товара из корзины
function removeItem(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
  updateCartCounter();
}

// Функция обновления итоговых сумм (subtotal, налоги, total)
function updateTotals() {
  let subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let taxes = subtotal * 0.1; // пример 10% налог
  let total = subtotal + taxes;

  // Обновляем данные на странице корзины (shopping-cart)
  const subtotalEl = document.querySelector('.shoping__checkout ul li:nth-child(1) span');
  const taxesEl = document.querySelector('.shoping__checkout ul li:nth-child(2) span');
  const totalEl = document.querySelector('.shoping__checkout ul li:nth-child(3) span');
  if (subtotalEl && taxesEl && totalEl) {
    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    taxesEl.textContent = `$${taxes.toFixed(2)}`;
    totalEl.textContent = `$${total.toFixed(2)}`;
  }
}

// При загрузке страницы добавляем обработчики событий
document.addEventListener('DOMContentLoaded', () => {
  // Обработчик на странице товара shop-details.html
  const addBtn = document.getElementById('add-to-cart-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const productElement = document.querySelector('.product__details__text h3');
      const id = productElement.getAttribute('data-id');
      const name = productElement.getAttribute('data-name');
      const price = parseFloat(productElement.getAttribute('data-price'));
      const quantityInput = document.getElementById('product-quantity');
      const quantity = parseInt(quantityInput.value) || 1;
      let selectedFlavor = 'Default';
      const flavorSelect = document.getElementById('flavor-select');
      if (flavorSelect) {
        selectedFlavor = flavorSelect.value;
      } else {
        const activeBtn = document.querySelector('.flavor-option.active');
        if (activeBtn) selectedFlavor = activeBtn.textContent;
      }

      const existing = cart.find(item => item.id === id && item.flavor === selectedFlavor);
      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.push({ id, name, price, quantity, flavor: selectedFlavor });
      }
      saveCart();
      updateCartCounter();
      alert('Product added to cart!');
    });
  }

  // Если на странице корзины (shoping-cart.html) – отрисовываем корзину
  if (document.querySelector('.shoping-cart')) {
    renderCart();
  }

  updateCartCounter();
});
