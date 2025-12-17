"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/ui/States";

export default function CommercialDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/subscriptions/manual");
  }, [router]);

  return <LoadingState message="Redirection..." />;
}
