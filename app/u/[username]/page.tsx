import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicProfile, getUserPublishedDiagrams } from '@/lib/supabase/server';
import { ProfileHeader } from './_components/ProfileHeader';
import { DiagramGrid } from './_components/DiagramGrid';

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) return { title: 'User not found' };

  return {
    title: `${profile.username} — ArchiGram.ai`,
    description: profile.bio ?? `${profile.username}'s architecture diagrams on ArchiGram.ai`,
    openGraph: {
      title: `${profile.username} on ArchiGram.ai`,
      description: profile.bio ?? `${profile.username}'s architecture diagrams`,
      images: [`/api/og-image?title=${encodeURIComponent(profile.username)}`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${profile.username} on ArchiGram.ai`,
    },
  };
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) notFound();

  const diagrams = await getUserPublishedDiagrams(profile.id);

  return (
    <main className="min-h-screen bg-[#09090b] text-[rgb(228,228,231)]">
      <ProfileHeader profile={profile} />
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-lg font-bold mb-6 text-[rgb(228,228,231)]">
          Published Diagrams ({profile.diagram_count})
        </h2>
        <DiagramGrid diagrams={diagrams} />
      </section>
    </main>
  );
}
