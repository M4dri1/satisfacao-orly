import { EvaluationForm } from "@/components/EvaluationForm";
import { notFound } from "next/navigation";

type PageProps = {
  params: { mesa: string };
};

export default function AvaliarMesaPage({ params }: PageProps) {
  const mesa = Number(params.mesa);
  if (!Number.isInteger(mesa) || mesa < 1 || mesa > 200) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <EvaluationForm mesa={mesa} />
    </main>
  );
}
