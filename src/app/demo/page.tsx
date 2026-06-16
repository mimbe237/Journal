import { Metadata } from "next";
import Link from "next/link";
import { DemoEditionReader } from "./DemoEditionReader";

export const metadata: Metadata = {
  title: "Aperçu démo — Journal Numérique",
  description: "Découvrez la dernière édition du journal numérique en accès libre. Feuilletez, zoomez, lisez sans inscription.",
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="flex-1">
        <DemoEditionReader />
      </div>
    </div>
  );
}
