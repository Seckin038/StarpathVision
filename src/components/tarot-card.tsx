import React from "react";

// Mapping of major arcana card identifiers to image paths in /public
export const MAJOR_ARCANA: Record<string, string> = {
  the_fool: "/tarot/the_fool.jpg",
  the_magician: "/tarot/the_magician.jpg",
  the_high_priestess: "/tarot/the_high_priestess.jpg",
  the_empress: "/tarot/the_empress.jpg",
  the_emperor: "/tarot/the_emperor.jpg",
  the_hierophant: "/tarot/the_hierophant.jpg",
  the_lovers: "/tarot/the_lovers.jpg",
  the_chariot: "/tarot/the_chariot.jpg",
  strength: "/tarot/strength.jpg",
  the_hermit: "/tarot/the_hermit.jpg",
  wheel_of_fortune: "/tarot/wheel_of_fortune.jpg",
  justice: "/tarot/justice.jpg",
  the_hanged_man: "/tarot/the_hanged_man.jpg",
  death: "/tarot/death.jpg",
  temperance: "/tarot/temperance.jpg",
  the_devil: "/tarot/the_devil.jpg",
  the_tower: "/tarot/the_tower.jpg",
  the_star: "/tarot/the_star.jpg",
  the_moon: "/tarot/the_moon.jpg",
  the_sun: "/tarot/the_sun.jpg",
  judgement: "/tarot/judgement.jpg",
  the_world: "/tarot/the_world.jpg",
};

export interface TarotCardProps {
  /**
   * The key of the card in `MAJOR_ARCANA`.
   */
  card: keyof typeof MAJOR_ARCANA;
  /** Optional alt text for the image */
  alt?: string;
  /** Optional additional class name */
  className?: string;
}

/**
 * Renders a tarot card image from the `public/tarot` directory.
 */
export function TarotCard({ card, alt, className }: TarotCardProps) {
  const src = MAJOR_ARCANA[card];
  return <img src={src} alt={alt ?? card.replace(/_/g, " ")} className={className} />;
}
