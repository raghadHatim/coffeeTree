// logic for cart page
(function () {
  var rows = document.getElementById('cart-items');
  var totalEl = document.getElementById('cart-total');
  var countEl = document.getElementById('.cart-count');
  var emptyEl = document.getElementById('cart-empty');
  var summaryEl = document.getElementById('cart-summary');
  if (!rows) return;

  function money(n) { return n.toFixed(2) + ' SAR'; }
  function update() {
    var total = 0, count = 0;
    rows.querySelectorAll('.cart-row').forEach(function (row) {
      var price = parseFloat(row.dataset.price);
      var qty = parseInt(row.querySelector('.qty-value').textContent, 10);
      row.querySelector('.cart-price').textContent = money(price * qty);
      total += price * qty;
      count += qty;
    });
    totalEl.textContent = money(total);
    if (countEl) countEl.textContent = count;
    var empty = rows.children.length === 0;
    emptyEl.hidden = !empty;
    summaryEl.hidden = empty;
  }

  rows.addEventListener('click', function (e) {
    var row = e.target.closest('.cart-row');
    if (!row) return;
    var step = e.target.closest('.qty-btn');
    var removeBtn = e.target.closest('.remove');

    if (step) {
      var qtyEl = row.querySelector('.qty-value');
      var next = parseInt(qtyEl.textContent, 10) + parseInt(step.dataset.step, 10);
      qtyEl.textContent = Math.max(1, next);
      update();
    } else if (removeBtn) {
      var productId = removeBtn.dataset.productId;
      if (productId) {
        fetch('/cart/remove/' + productId + '/')
          .then(response => response.json())
          .then(data => {
            if (data.status === 'success') {
              row.remove();
              update();
              var badge = document.querySelector('.cart-count');
              if (badge) badge.textContent = data.cart_count;
            }
          });
      }
    }
  });

  update();
})();
