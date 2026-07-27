import Stripe from "stripe";

export async function POST(req) {
  try {
    // Production guard: never create a payment intent against a test-mode
    // Stripe key in production. VERCEL_ENV distinguishes real production
    // from preview deploys (where NODE_ENV is also "production" and test
    // keys are expected); NODE_ENV is the fallback outside Vercel.
    const deployEnv = process.env.VERCEL_ENV || process.env.NODE_ENV;
    if (deployEnv === "production" && process.env.STRIPE_SECRET_KEY?.startsWith("sk_test")) {
      console.error("create-payment-intent refused: test-mode Stripe key in production");
      return Response.json(
        { error: "Payments are temporarily unavailable" },
        { status: 503 }
      );
    }

    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      return Response.json({ error: "Invalid amount" }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency: "usd",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    });

    return Response.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("create-payment-intent error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
