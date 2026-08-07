import { ProfileView } from '@/components/profile/profile-view';

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <ProfileView userId={userId} />;
}
