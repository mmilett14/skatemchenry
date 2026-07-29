const FULFILLMENT_OPTIONS = [
  { id: "pickup-skaturday", label: "Pickup during Skaturday Morning Session at Ryan Buss Zone Skatepark in McHenry", amount: 0 },
  { id: "pickup-trend-cellar", label: "Pickup at Trend Cellar in McHenry", amount: 0 },
  { id: "pickup-warp-corps", label: "Pickup at Warp Corps in Woodstock", amount: 0 },
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/register" || url.pathname === "/register/") {
      return Response.redirect("https://forms.gle/tpGDjhUdVLoBW2bv5", 302);
    }

    if (url.pathname === "/api/checkout") {
      if (request.method === "OPTIONS") {
        return handleOptions();
      }
      if (request.method === "POST") {
        return handleCheckout(request, env);
      }
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleCheckout(request, env) {
  const origin = request.headers.get("origin") || "https://skatemchenry.org";

  try {
    const { cart } = await request.json();

    if (!cart || cart.length === 0) {
      return json({ error: "Cart is empty" }, 400, origin);
    }

    const body = new URLSearchParams();
    body.append("mode", "payment");
    body.append("success_url", `${origin}/store-success/`);
    body.append("cancel_url", `${origin}/store/`);

    cart.forEach((item, i) => {
      body.append(`line_items[${i}][price_data][currency]`, "usd");
      body.append(`line_items[${i}][price_data][product_data][name]`, item.name);
      body.append(`line_items[${i}][price_data][unit_amount]`, String(item.price));
      body.append(`line_items[${i}][quantity]`, String(item.quantity));
    });

    FULFILLMENT_OPTIONS.forEach((opt, i) => {
      body.append(`shipping_options[${i}][shipping_rate_data][type]`, "fixed_amount");
      body.append(`shipping_options[${i}][shipping_rate_data][fixed_amount][amount]`, String(opt.amount));
      body.append(`shipping_options[${i}][shipping_rate_data][fixed_amount][currency]`, "usd");
      body.append(`shipping_options[${i}][shipping_rate_data][display_name]`, opt.label);
    });

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const session = await res.json();

    if (!res.ok) {
      return json({ error: session.error?.message || "Stripe error" }, 500, origin);
    }

    return json({ url: session.url }, 200, origin);
  } catch (err) {
    return json({ error: "Server error" }, 500, origin);
  }
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
    },
  });
}

function handleOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
