import { getAuthorizedRcAdmin } from "@/lib/authz";
import { OperatorShell } from "@/app/components/OperatorShell";

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getAuthorizedRcAdmin();
  return <OperatorShell>{children}</OperatorShell>;
}
