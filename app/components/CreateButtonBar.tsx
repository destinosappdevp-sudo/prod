"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SubmitButtons } from "./SubmitButtons";

function CreateButtonBar() {
  return (
    <div className="fixed w-full bottom-0 z-10 bg-white border-t h-24">
      <div className="flex items-center justify-between mx-auto px-5 lg:px-10 h-full">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="lg" asChild>
            <Link href="/">Cancelar</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/my-dashboard?tab=listings">Guardar borrador</Link>
          </Button>
        </div>
        <SubmitButtons />
      </div>
    </div>
  );
}

export default CreateButtonBar;
