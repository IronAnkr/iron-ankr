export default function CartSuccessPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-24 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-white">Thank you for your purchase!</h1>
      <p className="mt-2 text-white/70">
        Your payment was successful. You’ll receive an email confirmation shortly.
      </p>
      <a href="/products" className="mt-6 inline-block rounded-md bg-white px-4 py-2 text-sm font-semibold text-black">Continue shopping</a>
    </div>
  );
}

