import { notFound } from "next/navigation";
import { getBank, listBanks } from "@/lib/qcm/registry";
import { QcmResultClient } from "@/components/qcm/QcmResultClient";

interface PageProps {
  params: Promise<{ profession: string }>;
}

export function generateStaticParams() {
  return listBanks().map((b) => ({ profession: b.professionId }));
}

export default async function QcmResultPage({ params }: PageProps) {
  const { profession } = await params;
  const bank = getBank(profession);
  if (!bank) notFound();
  return <QcmResultClient bank={bank} />;
}
