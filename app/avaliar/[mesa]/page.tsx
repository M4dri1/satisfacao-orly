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
    <main className="page-shell relative z-10 mx-auto min-h-screen max-w-md px-4 py-8 sm:px-5 sm:py-10">
      <EvaluationForm mesa={mesa} />
      <p className="mt-6 text-center text-xs text-orly-muted">
        Há 50 anos em Marília
      </p>
    </main>
  );
}
