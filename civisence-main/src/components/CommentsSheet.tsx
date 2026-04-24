import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, MessageCircle } from "lucide-react";
import { addComment, subscribeToComments } from "@/lib/firestore";
import { IssueComment } from "@/lib/types";
import { useAuth } from "@/lib/authContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  issueId: string;
  issueTitle: string;
  open: boolean;
  onClose: () => void;
}

const formatTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const CommentsSheet = ({ issueId, issueTitle, open, onClose }: Props) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const unsub = subscribeToComments(issueId, (c) => {
      setComments(c);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [issueId, open]);

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    try {
      await addComment(issueId, user.uid, user.name || "Anonymous", text);
      setText("");
    } catch {
      toast.error("Failed to post comment. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2000]"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-[2001] max-w-lg mx-auto"
          >
            <div className="bg-card rounded-t-3xl border-t border-x border-border shadow-2xl flex flex-col max-h-[75vh]">
              {/* Handle */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
                <div className="absolute left-1/2 -translate-x-1/2 top-2 w-8 h-1 rounded-full bg-muted-foreground/30" />
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">Comments</h3>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{issueTitle}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Comments list */}
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
                {comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <MessageCircle className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">No comments yet. Be the first!</p>
                  </div>
                ) : (
                  comments.map((c) => {
                    const isOwn = c.userId === user?.uid;
                    return (
                      <div key={c.id} className={cn("flex gap-2", isOwn && "flex-row-reverse")}>
                        {/* Avatar */}
                        <div className={cn(
                          "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold uppercase",
                          isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {c.userName.charAt(0)}
                        </div>
                        <div className={cn("max-w-[75%]", isOwn && "items-end flex flex-col")}>
                          <p className={cn("text-[10px] text-muted-foreground mb-0.5", isOwn && "text-right")}>
                            {isOwn ? "You" : c.userName} · {formatTime(c.createdAt)}
                          </p>
                          <div className={cn(
                            "px-3 py-2 rounded-2xl text-sm leading-snug",
                            isOwn
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted text-foreground rounded-tl-sm"
                          )}>
                            {c.text}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 pb-6 pt-3 border-t border-border flex-shrink-0">
                {user ? (
                  <div className="flex gap-2 items-end">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Write a comment..."
                      rows={1}
                      className="flex-1 resize-none bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 max-h-24"
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!text.trim() || sending}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                        text.trim() && !sending
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {sending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Send className="w-4 h-4" />
                      }
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">Log in to comment</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommentsSheet;
