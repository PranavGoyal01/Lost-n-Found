'use client'
import Link from 'next/link';

export default function Landing() {
  return (
    <main style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }} className="min-h-screen bg-white text-gray-900">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <span className="text-[15px] font-medium tracking-tight" style={{ fontFamily: 'system-ui, sans-serif' }}>
          Lost&amp;Found
        </span>
        <Link
          href="/auth"
          className="text-[13px] text-gray-500 border border-gray-200 rounded-md px-4 py-1.5 hover:bg-gray-50 transition-colors"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-8 pt-20 pb-16 text-center border-b border-gray-100">
        <p
          className="text-[11px] font-medium tracking-[0.1em] uppercase text-gray-400 mb-5"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          Missed connections, rediscovered
        </p>
        <h1 className="text-[44px] font-normal leading-[1.1] tracking-tight max-w-[480px] mx-auto mb-5 text-gray-900">
          You saw someone.{' '}
          <span className="text-gray-400">We'll help you find them.</span>
        </h1>
        <p
          className="text-[17px] text-gray-500 leading-relaxed max-w-[380px] mx-auto mb-10"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          Post a moment, describe where you were, and let the right person find their way back to you.
        </p>
        <div className="flex items-center justify-center gap-1">
          <Link
            href="/auth"
            className="bg-gray-900 text-white text-[14px] font-medium px-7 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            Get started — it&apos;s free
          </Link>
          <a
            href="#how"
            className="text-[14px] text-gray-400 px-5 py-3 hover:text-gray-700 transition-colors"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            See how it works
          </a>
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-8 py-14 bg-gray-50 border-b border-gray-100">
        <blockquote className="text-[22px] font-normal leading-relaxed max-w-[520px] text-gray-800">
          &ldquo;I saw her on the train every morning for a month. I finally posted. She found it two days later.&rdquo;
        </blockquote>
        <p
          className="text-[12px] text-gray-400 mt-4 tracking-wide"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          — User in New York, 2024
        </p>
      </section>

      {/* How it works */}
      <section className="px-8 py-14 border-b border-gray-100" id="how">
        <p
          className="text-[11px] font-medium tracking-[0.1em] uppercase text-gray-400 mb-8"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          How it works
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          {[
            {
              num: '01',
              title: 'Post a moment',
              desc: 'Describe where you were, when, and a brief note about the person you spotted.',
            },
            {
              num: '02',
              title: 'They find you',
              desc: "If they're looking too, they'll recognize your post and reach out — on their terms.",
            },
            {
              num: '03',
              title: 'Connect safely',
              desc: 'Both sides choose to connect. No unsolicited messages. No guessing.',
            },
          ].map((step) => (
            <div key={step.num} className="py-7 sm:py-0 sm:px-6 first:pl-0 last:pr-0">
              <p
                className="text-[11px] text-gray-400 font-medium tracking-wider mb-4"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                {step.num}
              </p>
              <p className="text-[15px] font-medium text-gray-900 mb-2 leading-snug">
                {step.title}
              </p>
              <p
                className="text-[13px] text-gray-500 leading-relaxed"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust bar */}
      <div className="flex flex-wrap items-center justify-center gap-8 px-8 py-8 border-b border-gray-100">
        {[
          'No profile required to browse',
          'Mutual consent to connect',
          'Posts expire automatically',
          'Free to start',
        ].map((item) => (
          <span
            key={item}
            className="flex items-center gap-2 text-[12px] text-gray-400"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            <span className="w-1 h-1 rounded-full bg-gray-300 inline-block" />
            {item}
          </span>
        ))}
      </div>

      {/* Bottom CTA */}
      <section className="px-8 py-20 text-center">
        <h2 className="text-[28px] font-normal tracking-tight text-gray-900 mb-3">
          Ready to post your moment?
        </h2>
        <p
          className="text-[15px] text-gray-500 mb-8"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          Takes about two minutes. No credit card needed.
        </p>
        <form
          className="flex gap-2 max-w-sm mx-auto"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = '/auth';
          }}
        >
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 text-[14px] px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 transition-colors"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          />
          <button
            type="submit"
            className="bg-gray-900 text-white text-[14px] font-medium px-5 py-3 rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            Get started
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="flex items-center justify-between px-8 py-5 border-t border-gray-100">
        <span
          className="text-[12px] text-gray-400"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          © 2025 Lost&amp;Found
        </span>
        <div className="flex gap-5">
          {['Privacy', 'Terms', 'Contact'].map((link) => (
            <Link
              key={link}
              href={`/${link.toLowerCase()}`}
              className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              {link}
            </Link>
          ))}
        </div>
      </footer>
    </main>
  );
}