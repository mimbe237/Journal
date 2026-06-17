import { Metadata } from "next";
import { DemoEditionReader } from "./DemoEditionReader";

export const metadata: Metadata = {
  title: "Aperçu démo — Journal Numérique",
  description: "Découvrez la dernière édition du journal numérique en accès libre.",
};

export default function DemoPage() {
  return (
    <div className="h-screen overflow-hidden">
      <DemoEditionReader />
    </div>
  );
}
