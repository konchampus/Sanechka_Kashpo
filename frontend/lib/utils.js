// Утилита для формирования URL изображений
export function getImageUrl(path) {
  if (!path) return '/images/placeholder.jpg';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/images/')) return path;
  // Абсолютный url для dev
  const filename = path.split('/').pop();
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  return `${apiOrigin}/uploads/${encodeURIComponent(filename)}`;
}

// Подробный расчет корзины с опциями и скидкой
export function calculateCartTotals(cart, discount = 0) {
  let items = [];
  let total = 0;
  cart.forEach(item => {
    const opts = item.selectedOptions && item.options
      ? item.options.filter(opt => item.selectedOptions.includes(opt.name))
      : [];
    const optsTotal = opts.reduce((s, o) => s + (o.price || 0), 0) * item.quantity;
    const base = item.price * item.quantity;
    const itemTotal = base + optsTotal;
    items.push({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      options: opts,
      optionsTotal: optsTotal,
      itemTotal,
      id: item._id
    });
    total += itemTotal;
  });
  const discountAmount = Math.round((total * discount) / 100);
  const finalTotal = total - discountAmount;
  return { items, total, discount, discountAmount, finalTotal };
} 