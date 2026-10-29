"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6 text-center">
      <AlertTriangle size={32} className="text-luxury-gold mb-6" />
      <h1 className="text-2xl font-serif text-luxury-black mb-3">
        Something went wrong
      </h1>
      <p className="text-sm text-gray-500 font-light mb-8 max-w-md">
        We couldn&apos;t load this page. Please try again, and contact us if the
        problem continues.
      </p>
      <Button variant="dark" onClick={() => reset()}>
        Try Again
      </Button>
    </div>
  );
}
