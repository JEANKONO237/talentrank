import { cn } from "@/lib/utils";

interface AvatarProps {
  initials: string;
  gradient: string;
  flag?: string;
  /** ISO country code — renders a real flag PNG via flagcdn.com (takes priority over `flag`). */
  countryCode?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  ring?: string;
  className?: string;
}

const sizeMap = {
  xs: "h-8 w-8 text-[11px]",
  sm: "h-10 w-10 text-[13px]",
  md: "h-12 w-12 text-[15px]",
  lg: "h-16 w-16 text-[18px]",
  xl: "h-24 w-24 text-[24px]",
};

const flagSizeMap = {
  xs: "text-[10px] -bottom-0.5 -right-0.5",
  sm: "text-[12px] -bottom-0.5 -right-0.5",
  md: "text-[14px] -bottom-1 -right-1",
  lg: "text-[16px] -bottom-1 -right-1",
  xl: "text-[20px] -bottom-1.5 -right-1.5",
};

const flagImgSizeMap: Record<NonNullable<AvatarProps["size"]>, { w: number; h: number; pos: string }> = {
  xs: { w: 14, h: 10, pos: "-bottom-0.5 -right-1" },
  sm: { w: 18, h: 13, pos: "-bottom-0.5 -right-1" },
  md: { w: 22, h: 16, pos: "-bottom-1 -right-1.5" },
  lg: { w: 26, h: 19, pos: "-bottom-1 -right-1.5" },
  xl: { w: 32, h: 24, pos: "-bottom-1.5 -right-2" },
};

export function Avatar({ initials, gradient, flag, countryCode, size = "md", ring, className }: AvatarProps) {
  const lowerCode = countryCode?.toLowerCase();
  const flagImg = lowerCode ? flagImgSizeMap[size] : null;
  return (
    <span className={cn("relative inline-block shrink-0", className)}>
      <span
        className={cn(
          "relative grid place-items-center rounded-full font-display font-semibold text-mist-50/95",
          "bg-gradient-to-br shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.18),inset_0_-12px_24px_-12px_rgb(0_0_0_/_0.45)]",
          "ring-2 ring-ink-950",
          sizeMap[size],
          gradient,
          ring,
        )}
        style={{ letterSpacing: "-0.02em" }}
      >
        <span className="relative z-[1] mix-blend-screen drop-shadow-[0_1px_0_rgba(0,0,0,0.4)]">{initials}</span>
        <span className="pointer-events-none absolute inset-0 rounded-full bg-noise opacity-[0.07] mix-blend-overlay" />
      </span>
      {lowerCode && flagImg ? (
        <span
          className={cn(
            "absolute grid place-items-center rounded-[5px] bg-ink-900 p-[2px] ring-2 ring-ink-950 shadow-md",
            flagImg.pos,
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://flagcdn.com/w40/${lowerCode}.png`}
            srcSet={`https://flagcdn.com/w80/${lowerCode}.png 2x`}
            width={flagImg.w}
            height={flagImg.h}
            alt={`${countryCode?.toUpperCase()} flag`}
            className="block rounded-[3px] object-cover"
            loading="lazy"
            decoding="async"
          />
        </span>
      ) : flag ? (
        <span
          className={cn(
            "absolute grid place-items-center rounded-full bg-ink-900 ring-2 ring-ink-950 leading-none",
            flagSizeMap[size],
          )}
          style={{ padding: size === "xl" ? 4 : 2 }}
        >
          {flag}
        </span>
      ) : null}
    </span>
  );
}
