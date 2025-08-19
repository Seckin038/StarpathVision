import React from "react";

import { MAJOR_ARCANA, type MajorArcanaKey } from "@/lib/tarot";

type TarotCardProps = {
  /** The key of the card in `MAJOR_ARCANA`. */
  card: MajorArcanaKey;
  /** Optional alt text for the image */
  alt?: string;
  /** Optional additional class name */
  className?: string;
};

/**
 * Renders a tarot card image from the `public/tarot` directory.
 */
export function TarotCard({ card, alt, className }: TarotCardProps) {
  const src = MAJOR_ARCANA[card];
  return <img src={src} alt={alt ?? card.replace(/_/g, " ")} className={className} />;
}
