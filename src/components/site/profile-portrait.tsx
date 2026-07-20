import Image from "next/image";

import { cn } from "@/lib/utils";

export function ProfilePortrait({
  className,
  priority = false,
  large = false,
  side = false,
  ghost = false,
}: {
  className?: string;
  priority?: boolean;
  large?: boolean;
  side?: boolean;
  ghost?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "absolute inset-x-[5%] top-[8%] h-[72%] rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.94),_rgba(255,255,255,0)_72%)] blur-3xl",
        ghost && "opacity-55"
      )} />
      <div className={cn(
        "absolute bottom-[12%] right-[6%] h-[36%] w-[28%] rounded-full bg-[radial-gradient(circle,_rgba(188,175,150,0.18),_rgba(188,175,150,0)_76%)] blur-3xl",
        ghost && "opacity-60"
      )} />
      <div className={cn(
        "absolute right-[8%] top-[12%] h-[55%] w-[24%] rounded-full bg-[radial-gradient(circle,_rgba(17,17,17,0.12),_rgba(17,17,17,0)_70%)] blur-3xl",
        ghost && "opacity-65"
      )} />
      <div className="relative overflow-hidden">
        <Image
          src="/images/profile/corentin-saint-girons-hero-v2.png"
          alt="Portrait of Corentin Saint-Girons"
          width={1200}
          height={1800}
          priority={priority}
          sizes={side ? "(max-width: 1023px) 1px, 38vw" : "(max-width: 768px) 90vw, 40vw"}
          className={cn(
            "relative z-10 w-full object-cover object-top [mask-size:100%_100%,100%_100%] [mask-position:center,center] [mask-repeat:no-repeat,no-repeat]",
            ghost
              ? "opacity-[0.24] mix-blend-darken blur-[0.4px] saturate-[0.8] drop-shadow-none"
              : "mix-blend-multiply drop-shadow-[0_42px_76px_rgba(15,15,15,0.1)]",
            side
              ? "object-[52%_top] [mask-image:radial-gradient(ellipse_48%_70%_at_52%_38%,black_0%,black_52%,rgba(0,0,0,0.86)_62%,rgba(0,0,0,0.38)_72%,transparent_86%),linear-gradient(to_bottom,black_0%,black_76%,rgba(0,0,0,0.6)_87%,transparent_100%)]"
              : "object-[50%_top] [mask-image:radial-gradient(ellipse_54%_66%_at_50%_42%,black_0%,black_56%,rgba(0,0,0,0.94)_63%,transparent_82%),linear-gradient(to_bottom,black_0%,black_82%,transparent_100%)]",
            large ? "aspect-[4/5] min-h-[38rem] md:min-h-[52rem]" : "h-auto",
          )}
        />
      </div>
    </div>
  );
}
