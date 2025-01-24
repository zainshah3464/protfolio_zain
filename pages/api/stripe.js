import Stripe from 'stripe';

const stripe = new Stripe(process.env.NEXT_SECRET_STRIPE_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Validate request body
      if (!req.body || !Array.isArray(req.body)) {
        return res.status(400).json({ error: 'Invalid request body' });
      }

      // Prepare Checkout Session parameters
      const params = {
        submit_type: 'pay',
        mode: 'payment',
        payment_method_types: ['card'],
        billing_address_collection: 'auto',
        shipping_options: [
          { shipping_rate: 'shr_1MJIEoHbmXqvpyhdyi5WNQHl' },
          { shipping_rate: 'shr_1MJIGgHbmXqvpyhdQCdPgK8F' },
        ],
        line_items: req.body.map((item) => {
          const img = item.image[0].asset._ref;
          const newImage = img
            .replace(
              'image-',
              'https://cdn.sanity.io/images/dow10h3v/production/'
            )
            .replace('-png', '.png');

          return {
            price_data: {
              currency: 'usd',
              product_data: {
                name: item.name,
                images: [newImage],
              },
              unit_amount: item.price * 100, // Convert dollars to cents
            },
            adjustable_quantity: {
              enabled: true,
              minimum: 1,
            },
            quantity: item.quantity,
          };
        }),
        success_url: `${req.headers.origin}/successPay`,
        cancel_url: `${req.headers.origin}/cart`,
      };

      // Create the Stripe Checkout session
      const session = await stripe.checkout.sessions.create(params);

      // Send the session as a response
      res.status(200).json(session);
    } catch (err) {
      console.error(err); // Log the error for debugging
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
