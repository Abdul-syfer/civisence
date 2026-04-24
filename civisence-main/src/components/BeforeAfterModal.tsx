import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  beforeUrl: string;
  afterUrl: string;
  title: string;
  initialSlide?: 0 | 1;
  onClose: () => void;
}

const slides = (beforeUrl: string, afterUrl: string) => [
  { url: beforeUrl, label: "BEFORE", labelClass: "bg-black/70 text-white", dotClass: "bg-white", textClass: "text-white" },
  { url: afterUrl, label: "AFTER", labelClass: "bg-emerald-500/90 text-white", dotClass: "bg-emerald-400", textClass: "text-emerald-400" },
];

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

const BeforeAfterModal = ({ beforeUrl, afterUrl, title, initialSlide = 0, onClose }: Props) => {
  const [active, setActive] = useState<0 | 1>(initialSlide);
  const [direction, setDirection] = useState(1);

  const items = slides(beforeUrl, afterUrl);

  const goTo = (index: 0 | 1) => {
    setDirection(index > active ? 1 : -1);
    setActive(index);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[3000] bg-black flex flex-col select-none"
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-safe-top pt-4 pb-3 shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-1 mr-3">
          <p className="text-white/50 text-[10px] font-medium uppercase tracking-wider mb-0.5">Before &amp; After</p>
          <h2 className="text-white font-semibold text-sm leading-tight line-clamp-1">{title}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Photo area */}
      <div className="flex-1 relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={active}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={(_, { offset, velocity }) => {
              if (offset.x < -60 || velocity.x < -400) goTo(1);
              else if (offset.x > 60 || velocity.x > 400) goTo(0);
            }}
            className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <img
              src={items[active].url}
              alt={items[active].label}
              className="w-full h-full object-contain"
              draggable={false}
            />
            {/* Photo label badge */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none">
              <span className={`text-sm font-bold px-5 py-2 rounded-full backdrop-blur-sm shadow-lg ${items[active].labelClass}`}>
                {items[active].label}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Left arrow (go to BEFORE) */}
        <AnimatePresence>
          {active === 1 && (
            <motion.button
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              onClick={() => goTo(0)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center z-10 border border-white/10"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Right arrow (go to AFTER) */}
        <AnimatePresence>
          {active === 0 && (
            <motion.button
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              onClick={() => goTo(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center z-10 border border-white/10"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Slide indicator */}
      <div
        className="shrink-0 flex items-center justify-center gap-8 py-5"
        onClick={e => e.stopPropagation()}
      >
        {([0, 1] as const).map(i => (
          <button key={i} onClick={() => goTo(i)} className="flex flex-col items-center gap-2">
            <motion.div
              animate={{ width: active === i ? 32 : 20, opacity: active === i ? 1 : 0.3 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`h-1 rounded-full ${active === i ? items[i].dotClass : "bg-white/30"}`}
            />
            <span className={`text-xs font-semibold transition-colors duration-200 ${active === i ? items[i].textClass : "text-white/30"}`}>
              {items[i].label}
            </span>
          </button>
        ))}
      </div>

      {/* Swipe hint */}
      <div
        className="shrink-0 pb-safe-bottom pb-5 flex items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-white/25 text-[11px] tracking-wide">swipe to compare</span>
      </div>
    </motion.div>
  );
};

export default BeforeAfterModal;
