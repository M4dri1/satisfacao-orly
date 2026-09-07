import { EvaluationForm } from "@/components/EvaluationForm";

export default function AvaliarPage() {
  return (
    <main className="page-shell relative z-10 mx-auto min-h-screen max-w-md px-4 py-8 sm:px-5 sm:py-10">
      <EvaluationForm />
      <p className="mt-6 text-center text-xs text-orly-muted">
        Há 50 anos em Marília
      </p>
    </main>
  );
}
