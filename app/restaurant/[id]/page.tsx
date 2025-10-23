"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    router.replace(`/restaurant/${id}/orders`);
  }, [id, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg text-muted-foreground">Redirecting...</p>
    </div>
  );
}
