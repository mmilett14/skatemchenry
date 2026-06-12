window.StoreCart = (function () {
  const STORAGE_KEY = "skatemchenry_cart";

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    document.dispatchEvent(new CustomEvent("cart:updated", { detail: cart }));
  }

  function addItem(id, name, price) {
    const cart = getCart();
    if (cart[id]) {
      cart[id].quantity++;
    } else {
      cart[id] = { id, name, price, quantity: 1 };
    }
    saveCart(cart);
  }

  function updateQty(id, delta) {
    const cart = getCart();
    if (!cart[id]) return;
    cart[id].quantity += delta;
    if (cart[id].quantity <= 0) delete cart[id];
    saveCart(cart);
  }

  function removeItem(id) {
    const cart = getCart();
    delete cart[id];
    saveCart(cart);
  }

  function count() {
    return Object.values(getCart()).reduce((sum, item) => sum + item.quantity, 0);
  }

  async function checkout(onError) {
    const items = Object.values(getCart());
    if (items.length === 0) return;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: items }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      if (onError) onError(err);
      else console.error(err);
    }
  }

  return { getCart, saveCart, addItem, updateQty, removeItem, count, checkout };
})();
