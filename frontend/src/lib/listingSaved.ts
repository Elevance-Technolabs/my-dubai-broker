import { toast } from "sonner";

/**
 * What happens after a listing form saves. Edits to an approved listing are
 * held for review (the live version stays until they are approved), so the
 * message says so; either way the partner lands on the listing itself.
 */
export function afterListingSaved(
  mode: "create" | "edit" | undefined,
  listingId: string | undefined,
  response: { data?: any },
  router: { push: (href: string) => void },
  createdMessage: string,
) {
  if (mode === "edit" && listingId) {
    if (response.data?.pendingChanges) {
      toast.success("Changes sent for review", {
        description: "The live listing stays as it is until a reviewer approves your changes.",
      });
    } else {
      toast.success("Listing updated");
    }
    router.push(`/listings/${listingId}`);
    return;
  }
  toast.success(createdMessage);
  router.push(response.data?.id ? `/listings/${response.data.id}` : "/dashboard/listings");
}
