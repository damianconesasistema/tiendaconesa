import Image from "next/image";

type Variant = "square" | "horizontal";

type Props = {
  className?: string;
  priority?: boolean;
  variant?: Variant;
};

const assets = {
  square: {
    src: "/brand/logo-square.png",
    width: 800,
    height: 800,
  },
  horizontal: {
    src: "/brand/logo.png",
    width: 280,
    height: 120,
  },
} as const;

export function ConesaLogo({
  className,
  priority = false,
  variant = "square",
}: Props) {
  const asset = assets[variant];
  return (
    <Image
      src={asset.src}
      alt="Sanitarios Conesa Traslasierra"
      width={asset.width}
      height={asset.height}
      quality={100}
      priority={priority}
      unoptimized
      className={className}
      sizes="(max-width: 640px) 70vw, 480px"
    />
  );
}
