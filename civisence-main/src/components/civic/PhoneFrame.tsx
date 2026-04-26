import { ReactNode } from "react";

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto" style={{ width: 300, height: 620 }}>
      <div className="absolute -inset-10 rounded-[3rem] bg-civic-blue/30 blur-3xl -z-10" />
      <div
        className="relative w-full h-full rounded-[2.75rem] p-[10px] bg-gradient-to-b from-civic-navy-deep to-civic-navy"
        style={{ boxShadow: "var(--shadow-phone)" }}
      >
        <div className="relative w-full h-full rounded-[2.25rem] overflow-hidden bg-white">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-civic-navy-deep rounded-full z-50" />
          {children}
        </div>
      </div>
    </div>
  );
}
