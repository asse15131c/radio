"use client";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function Header() {
  const path = usePathname();

  return (
    <header className="z-50 fixed top-0 left-0 right-0 p-2 hover:underline text-white mix-blend-exclusion font-serif list-disc leading-none">
      <nav>
        <ul>
          <li>
            <a href="/" className={clsx({ underline: path == "/" })}>
              Metaball
            </a>
          </li>
          <li>
            <a
              href="/distortion"
              className={clsx({ underline: path == "/distortion" })}
            >
              Distortion
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
