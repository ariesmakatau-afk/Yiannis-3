"use client";

import type { ComponentProps } from "react";
import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";

type Props = ComponentProps<"a"> & {
  event: AnalyticsEvent;
};

// Same reasoning as TrackedLink.tsx, for plain <a> tags (tel:, mailto:,
// external links) used from Server Components.
export default function TrackedAnchor({ event, onClick, ...rest }: Props) {
  return (
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    <a
      {...rest}
      onClick={(e) => {
        trackEvent(event);
        onClick?.(e);
      }}
    />
  );
}
