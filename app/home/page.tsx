"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
	const router = useRouter();

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		router.replace("/auth");
	};

	return (
		<div className='min-h-screen bg-white flex flex-col' style={{ fontFamily: "system-ui, sans-serif" }}>
			{/* Nav */}
			<nav className='flex items-center justify-between px-8 py-5 border-b border-gray-100'>
				<span className='text-[15px] font-medium tracking-tight text-gray-900'>Lost&amp;Found</span>
				<Link href='/profile' className='text-[13px] text-gray-400 hover:text-gray-700 transition-colors'>
					Profile
				</Link>
			</nav>

			{/* Main */}
			<main className='flex-1 flex flex-col items-center justify-center px-6 py-16'>
				<div className='w-full max-w-sm'>
					{/* Heading */}
					<p className='text-[11px] font-medium tracking-[0.1em] uppercase text-gray-400 mb-4 text-center'>What would you like to do?</p>
					<h1 className='text-[32px] font-normal tracking-tight text-center text-gray-900 mb-10 leading-tight' style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
						Your moments.
					</h1>

					{/* Primary action */}
					<Link href='/moments/new' className='block w-full bg-gray-900 text-white text-[14px] font-medium text-center py-3.5 rounded-lg hover:bg-gray-700 transition-colors mb-3'>
						I saw someone
					</Link>

					{/* Secondary actions */}
					<div className='flex flex-col gap-2'>
						<Link href='/moments' className='block w-full text-[14px] text-gray-600 font-medium text-center py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors'>
							My moments
						</Link>
						<Link href='/matches' className='block w-full text-[14px] text-gray-600 font-medium text-center py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors'>
							My matches
						</Link>
						<button onClick={handleSignOut} className='block w-full text-[14px] text-gray-500 font-medium text-center py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors'>
							Sign out
						</button>
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className='px-8 py-5 border-t border-gray-100'>
				<p className='text-[12px] text-gray-400 text-center'>© 2026 Lost&amp;Found</p>
			</footer>
		</div>
	);
}
