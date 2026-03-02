import Link from 'next/link';

export default function ProfileNotFound() {
  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-center px-4">
      <p className="text-6xl font-bold text-[rgb(99,102,241)]">404</p>
      <h1 className="mt-4 text-2xl font-bold text-[rgb(228,228,231)]">User not found</h1>
      <p className="mt-2 text-[rgb(161,161,170)]">
        This profile doesn&apos;t exist or may have been removed.
      </p>
      <Link
        href="/gallery"
        className="mt-6 px-5 py-2.5 rounded-lg bg-[rgb(99,102,241)] hover:bg-[rgb(79,70,229)] text-white text-sm font-medium transition-colors"
      >
        Browse Gallery
      </Link>
    </div>
  );
}
