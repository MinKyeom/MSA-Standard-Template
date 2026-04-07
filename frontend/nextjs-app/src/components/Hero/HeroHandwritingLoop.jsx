"use client";

export default function HeroHandwritingLoop({
  title = "MinKowskiM",
  subtitle = "A personal log across space and time.",
  className = "",
}) {
  return (
    <div className={`hero-handwriting ${className}`} aria-label={`${title} ${subtitle}`}>
      <h1 className="hero-handwriting__line hero-handwriting__title">
        <span className="hero-handwriting__ink hero-handwriting__ink--title">{title}</span>
      </h1>
      <p className="hero-handwriting__line hero-handwriting__subtitle">
        <span className="hero-handwriting__ink hero-handwriting__ink--subtitle">{subtitle}</span>
      </p>
    </div>
  );
}

