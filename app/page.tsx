import Link from 'next/link';

export default function Landing() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold">Lost&Found</h1>
      <p>You saw someone. We'll find them.</p>
      <div className="mt-8 gap-4 flex">
        <Link href="/auth" className="p-3 bg-blue-600 text-white rounded">Sign Up / Log In</Link>
      </div>
    </main>
  );
}