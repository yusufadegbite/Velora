"use client";
import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReview } from "@/actions/engagement";
import { Input, Textarea, FormMessage } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function ReviewForm({ vehicleId }: { vehicleId: string }) {
  const [state, action] = useActionState(submitReview, undefined);
  const [rating, setRating] = useState(5);
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <input type="hidden" name="rating" value={rating} />
      <fieldset>
        <legend className="mb-1.5 text-[0.78rem] font-semibold">Your rating</legend>
        <div className="flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className="p-0.5">
              <Star className={n <= rating ? "size-6 fill-gold text-gold" : "size-6 text-line"} />
            </button>
          ))}
        </div>
      </fieldset>
      <Input label="Title" name="title" error={state?.errors?.title} />
      <Textarea label="Your review" name="body" rows={4} error={state?.errors?.body} />
      <SubmitButton variant="dark" pendingText="Publishing…">Publish review</SubmitButton>
    </form>
  );
}
