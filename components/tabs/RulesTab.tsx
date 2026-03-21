import { rules } from "@/lib/schedule";

export default function RulesTab() {
  return (
    <div className="px-7 pt-12 pb-28">
      {/* Header */}
      <div className="fade-up delay-1 mb-11">
        <p className="text-[10px] tracking-widest2 uppercase text-brown/30 mb-1">
          Please note
        </p>
        <h2 className="text-[32px] font-medium tracking-tight text-brown leading-none">
          Rules
        </h2>
      </div>

      {/* Rules list */}
      <div className="fade-up delay-2 flex flex-col">
        {rules.map((rule, i) => (
          <div
            key={i}
            className="flex gap-5 py-6 border-b border-brown/[0.07] last:border-0"
          >
            {/* Number */}
            <span className="font-bold text-[12px] text-brown/20 tabular-nums pt-0.5 w-5 shrink-0">
              {String(i + 1).padStart(2, "0")}
            </span>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[16px] font-medium text-brown">
                  {rule.title}
                </h3>
              </div>
              <p className="text-[12px] text-brown/45 leading-relaxed font-light">
                {rule.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="fade-up delay-3 mt-10 flex items-start gap-3 p-4 border border-brown/10 rounded-sm">
        <p className="text-[11px] text-brown/40 leading-relaxed font-light">
          In a legitimate emergency, please reach out to a leader immediately.
        </p>
      </div>
    </div>
  );
}
