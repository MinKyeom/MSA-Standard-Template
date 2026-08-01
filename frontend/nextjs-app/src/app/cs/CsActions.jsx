"use client";

import Link from "next/link";
import { useAuth } from "../../providers/AuthProvider";

export default function CsActions() {
  const { isAdmin, isAuthInitialized } = useAuth();

  if (!isAuthInitialized || !isAdmin) {
    return null;
  }

  return (
    <div className="about-actions">
      <Link href="/cs/edit" className="btn-primary-small">
        Edit CS Notes
      </Link>
    </div>
  );
}
