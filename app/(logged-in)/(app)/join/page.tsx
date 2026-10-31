import { redirect } from "next/navigation";

/** Deep link from an invitation message: /join?code=ABCD-EFGH */
export default async function JoinPage(props: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await props.searchParams;
  redirect(code ? `/duo?code=${encodeURIComponent(code)}` : "/duo");
}
