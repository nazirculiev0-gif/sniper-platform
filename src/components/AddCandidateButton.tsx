"use client";

import { useState } from "react";
import AddCandidateModal from "@/components/AddCandidateModal";

export default function AddCandidateButton({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn btn-red btn-sm" onClick={() => setOpen(true)}>+ Добавить кандидата</button>
      {open && <AddCandidateModal requestId={requestId} onClose={() => setOpen(false)} />}
    </>
  );
}
