"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  useEffect(() => {
    router.replace(`/restaurant/@${slug}/orders`);
  }, [slug, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg text-muted-foreground">Redirecting...</p>
    </div>
  );
}
