import Image from "next/image";

type Props = {
  onNavigate: (tab: string) => void;
};

export default function HomeTab({ onNavigate }: Props) {
  return (
    <div className="flex flex-col justify-between min-h-[calc(100dvh-64px)] px-7 pt-16 pb-10">

      {/* Top: wordmark */}
      <div className="fade-up delay-1 mb-4">
        <p className="text-[10px] tracking-widest2 uppercase text-brown/35 mb-8">
          KCF · Mar 13-15, 2026
        </p>

        <h1 className="text-[clamp(58px,16vw,80px)] font-medium leading-[0.90] tracking-tight text-brown">
          Seek<br />First
          The Kingdom
        </h1>

        <div className="my-3 w-full flex justify-center items-center gap-2">
          <Image
            src="/running.png"
            alt="The Kingdom"
            width={0}
            height={0}
            sizes="100vw"
            className="w-full h-auto mx-auto"
            loading="eager"
          />        </div>

        <span className="text-[14px] text-brown/45 leading-relaxed font-light">
          "But seek first his kingdom and his righteousness, and all these things will be given to you."
          <br />Matthew 6:33
        </span>
      </div>

      {/* Bottom: nav links */}
      <nav className="fade-up delay-3 flex flex-col mb-16">
        {[
          { label: "Rules", tab: "rules" },
          { label: "Info", tab: "info" },
          { label: "Schedule", tab: "schedule" },
          { label: "Small Groups", tab: "groups" },
        ].map(({ label, tab }) => (
          <button
            key={tab}
            onClick={() => onNavigate(tab)}
            className="flex items-center justify-between py-3.5 border-t border-brown/10 last:border-b group text-left"
          >
            <span className="text-sm text-brown/80 group-hover:text-brown transition-colors">
              {label}
            </span>
            <span className="text-[11px] text-brown/20 group-hover:text-brown/50 transition-colors">
              →
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}