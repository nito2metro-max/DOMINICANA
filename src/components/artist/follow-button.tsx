"use client";
import { useActionState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { toggleFollowAction } from "@/app/actions/public";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FollowButton({ artistId, slug, following }: { artistId: string; slug: string; following: boolean }) {
  const [state, action, pending] = useActionState(toggleFollowAction.bind(null, artistId, slug), undefined);
  return (
    <form action={action} className="contents">
      <button type="submit" disabled={pending} aria-pressed={following} className={cn(buttonClasses(following ? "secondary" : "outline", "md"), "min-w-36")}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Heart className={cn("size-4", following && "fill-current")} />}
        {following ? "Siguiendo" : "Seguir"}
      </button>
      {state && !state.ok && state.message && (
        <p role="alert" className="w-full text-sm text-rose-600">
          {state.message}
        </p>
      )}
    </form>
  );
}
