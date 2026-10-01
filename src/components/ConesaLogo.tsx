import Image from "next/image";

type Props = {
  className?: string;
  priority?: boolean;
};

export function ConesaLogo({ className, priority = false }: Props) {
  return (
    <Image
      src="/brand/logo-square.png"
      alt="Sanitarios Conesa Traslasierra"
      width={800}
      height={800}
      quality={100}
      priority={priority}
      unoptimized
      className={className}
      sizes="(max-width: 640px) 70vw, 480px"
    />
  );
}
