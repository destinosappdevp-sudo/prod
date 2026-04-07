"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";

const accountLinks = [
  { label: "Mis ahorros", href: "/my-dashboard?tab=mi-alcancia" },
  { label: "Mi perfil", href: "/my-dashboard?tab=profile" },
  { label: "Eliminar mi cuenta", href: "/eliminar-cuenta" },
];

export default function FooterAccountLinks() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user);
    });
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>, href: string) => {
    e.preventDefault();
    if (loggedIn) {
      router.push(href);
    } else {
      router.push(`/login?next=${encodeURIComponent(href)}`);
    }
  };

  return (
    <ul className="space-y-3">
      {accountLinks.map((link) => (
        <li key={link.label}>
          <button
            onClick={(e) => handleClick(e, link.href)}
            className="text-left text-sm text-gray-400 transition-colors hover:text-primary"
          >
            {link.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
