import { QcmEditorClient } from "@/components/qcm-builder/QcmEditorClient";

export const metadata = { title: "Éditer un QCM — TalentRank" };

export default async function QcmEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QcmEditorClient qcmId={id} />;
}
