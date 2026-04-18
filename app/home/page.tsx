import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center mt-20 gap-4">
      <Link href="/moments/new" className="bg-blue-500 p-4 text-white rounded">I Saw Someone (Post Moment)</Link>
      <Link href="/moments" className="border p-4 rounded">My Moments</Link>
      <Link href="/matches" className="border p-4 rounded">My Matches</Link>
      <Link href="/profile" className="border p-4 rounded">Profile</Link>
    </div>
  );
}