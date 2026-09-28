"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { business } from "@/lib/content";

const primaryLinks = [
  { href: "/menu", label: "Menu" },
  { href: "/parea", label: "Parea Mas" },
  { href: "/about", label: "About" },
  { href: "/location", label: "Location" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="header-glass sticky top-0 z-40">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        {/* Logo in a thin framed box, name set beside it in the serif. */}
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex shrink-0 items-center border border-cobalt/25 bg-chalk/60 p-1">
            <Image
              src="/images/medallion-512.png"
              alt=""
              width={512}
              height={512}
              className="h-9 w-9 rounded-full"
              priority
            />
          </span>
          <span className="min-w-0 truncate font-display text-xl font-medium text-cobalt-dark">
            Yianni&rsquo;s
          </span>
        </Link>

        <div className="hidden items-center gap-10 lg:flex">
          <nav aria-label="Primary" className="flex items-center gap-8">
            <Link
              href="/"
              className="text-[13px] tracking-wide text-cobalt-dark transition-colors hover:text-ember"
            >
              Home
            </Link>
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] tracking-wide text-cobalt-dark/60 transition-colors hover:text-ember"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link href="/order" className="btn-olive !px-5 !py-2.5 !text-[13px]">
            Order Now
          </Link>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-cobalt-dark transition-colors hover:bg-cobalt/5 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {open ? (
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu — a cream panel dropping from the stone bar */}
      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="menu-panel lg:hidden">
          <div className="key-divider-cobalt opacity-20" aria-hidden="true" />
          <div className="container-page pb-6 pt-3">
            <ul className="flex flex-col">
              {primaryLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="menu-panel-link"
                  >
                    <span className="font-display text-lg font-semibold tracking-tight">
                      {link.label}
                    </span>
                    <span aria-hidden="true" className="text-cobalt/35">
                      &rarr;
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <a href={business.phoneHref} className="menu-panel-link border-b-0">
                  <span className="font-display text-lg font-semibold tracking-tight">
                    Call {business.phone}
                  </span>
                  <span aria-hidden="true" className="text-cobalt/35">
                    &rarr;
                  </span>
                </a>
              </li>
            </ul>
            <Link
              href="/order"
              onClick={() => setOpen(false)}
              className="btn-olive mt-5 w-full"
            >
              Order Now
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
