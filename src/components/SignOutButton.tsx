"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button className="btn btn-ghost btn-sm" onClick={() => signOut({ callbackUrl: "/login" })}>
      Выйти
    </button>
  );
}
