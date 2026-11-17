import { Suspense } from "react";
import AdminListingsView from "@/components/views/AdminListingsView";

export default function AdminListingsPage() {
  // Suspense: the view reads ?listing= (notification links) from the URL.
  return (
    <Suspense>
      <AdminListingsView />
    </Suspense>
  );
}
