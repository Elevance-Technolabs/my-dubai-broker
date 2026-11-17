import { Suspense } from "react";
import AdminCompaniesView from "@/components/views/AdminCompaniesView";

export default function AdminCompaniesPage() {
  // Suspense: the view reads ?company= (notification links) from the URL.
  return (
    <Suspense>
      <AdminCompaniesView />
    </Suspense>
  );
}
