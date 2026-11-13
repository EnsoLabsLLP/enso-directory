import icons from "@/lib/icons.json";

// Tabler icons (MIT licence), inlined so nothing loads from outside. Rebuild with `npm run icons`.
export default function Icon({ name, size = 18, className = "", strokeWidth = 1.75 }) {
  return (
    <svg
      className={`ic ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: icons[name] || "" }}
    />
  );
}
