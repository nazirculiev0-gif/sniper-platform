"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button className="side-switch" style={{ border: "none" }} onClick={() => signOut({ callbackUrl: "/login" })}>
      Выйти
    </button>
  );
}
