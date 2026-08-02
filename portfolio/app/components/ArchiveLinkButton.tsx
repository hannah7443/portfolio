import Image from "next/image";
import Link from "next/link";

type ArchiveLinkButtonProps = {
  href: string;
  quote?: string;
  title?: string;
  cta?: string;
  backgroundImage?: string;
};

export default function ArchiveLinkButton({ href, quote, title, cta, backgroundImage }: ArchiveLinkButtonProps) {
  const displayTitle = title;

  return (
    <Link
      href={href}
      className="group relative block aspect-[514/334] w-full max-w-[560px] overflow-hidden rounded-[25px] bg-black transition-transform hover:scale-[1.02]"
    >
      {backgroundImage ? (
        <Image src={backgroundImage} alt="" fill className="object-cover" />
      ) : (
        <div className="absolute inset-0 bg-neutral-900" />
      )}

      {quote && (
        <p className="absolute left-1/2 top-[6.6%] w-[80%] -translate-x-1/2 text-center text-[0.7rem] italic text-white/80">
          {quote}
        </p>
      )}

      {displayTitle && (
        <p className="redaction-50 absolute left-1/2 top-[68%] -translate-x-1/2 text-center text-[1.5rem] text-white not-italic">
          {displayTitle}
        </p>
      )}

      {cta && (
        <span className="absolute left-1/2 top-[85%] -translate-x-1/2 whitespace-nowrap rounded-full border border-white/60 px-4 py-1.5 text-xs text-white group-hover:bg-white group-hover:text-black">
          {cta}
        </span>
      )}
    </Link>
  );
}
