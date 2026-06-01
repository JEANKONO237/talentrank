import { ChasseClient } from "@/components/recruiter/ChasseClient";

export const metadata = { title: "Chasse de talents — TalentRank" };

interface PageProps {
  searchParams: Promise<{ classe?: string }>;
}

export default async function ChassePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const initialClass = sp.classe?.toUpperCase();
  const valid = ["S", "A", "B", "C", "D", "E"].includes(initialClass ?? "")
    ? (initialClass as "S" | "A" | "B" | "C" | "D" | "E")
    : null;

  return <ChasseClient initialClass={valid} />;
}
