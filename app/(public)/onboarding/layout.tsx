import { getAuthorizedRcAdmin } from "@/lib/authz";

export default async function OnboardingProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getAuthorizedRcAdmin();
  return children;
}
