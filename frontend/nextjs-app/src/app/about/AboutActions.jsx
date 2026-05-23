"use client";

import Link from "next/link";
import { useAuth } from "../../providers/AuthProvider";

export default function AboutActions() {
  const { isAdmin, isAuthInitialized } = useAuth();

  if (!isAuthInitialized || !isAdmin) {
    return null;
  }

  return (
    <div className="about-actions">
      <Link href="/about/edit" className="btn-primary-small">
        Edit About
      </Link>
    </div>
  );
}
