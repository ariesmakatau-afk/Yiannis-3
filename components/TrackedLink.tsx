"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";

type Props = ComponentProps<typeof Link> & {
  event: AnalyticsEvent;
};

// Server Components (pages, Footer, etc.) can't attach onClick directly to
// a <Link>/<a> — that requires a Client Component boundary. This tiny
// wrapper is that boundary, so pages can stay server-rendered while still
// firing GA4 events on click.
export default function TrackedLink({ event, onClick, ...rest }: Props) {
  return (
    <Link
      {...rest}
      onClick={(e) => {
        trackEvent(event);
        onClick?.(e);
      }}
    />
  );
}
