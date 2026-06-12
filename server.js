const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/checkout', async (req, res) => {
  try {
    const items = JSON.parse(Buffer.from(req.query.items, 'base64').toString());
    if (!Array.isArray(items) || items.length === 0) {
      return res.redirect(req.query.cancel || 'https://blklinebio.com.au/pages/checkout.html');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: items.map(i => ({ price: i.p, quantity: i.q })),
      success_url: req.query.success || 'https://blklinebio.com.au/pages/success.html',
      cancel_url: req.query.cancel || 'https://blklinebio.com.au/pages/checkout.html',
      shipping_address_collection: { allowed_countries: ['AU'] },
      billing_address_collection: 'required',
    });

    res.redirect(303, session.url);
  } catch (err) {
    console.error('Checkout error:', err.message);
    res.redirect(req.query.cancel || 'https://blklinebio.com.au/pages/checkout.html');
  }
});

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { lineItems, successUrl, cancelUrl } = req.body;
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: 'lineItems required' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems.map(item => ({ price: item.price, quantity: item.quantity })),
      success_url: successUrl || 'https://blklinebio.com.au/pages/success.html',
      cancel_url: cancelUrl || 'https://blklinebio.com.au/pages/checkout.html',
      shipping_address_collection: { allowed_countries: ['AU'] },
      billing_address_collection: 'required',
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Stripe API running on port ${PORT}`));
