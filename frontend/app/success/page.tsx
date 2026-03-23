export default function SuccessPage() {
  return (
    <section className="flex flex-col items-center justify-center min-h-screen text-white gap-4">
      <h1 className="text-4xl font-bold">Payment Successful! 🎉</h1>
      <p className="text-gray-400">Your points have been added to your account.</p>
      <a href="/" className="mt-4 px-6 py-2 bg-purple-600 rounded-xl hover:bg-purple-700 transition">
        Go Home
      </a>
    </section>
  );
}