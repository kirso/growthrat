"use client";

export function OpenChatButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={() =>
        window.dispatchEvent(new CustomEvent("openGrowthRatChat"))
      }
      className={className}
    >
      {children}
    </button>
  );
}

export function SuggestedPrompt({ prompt, children }: { prompt: string; children?: React.ReactNode }) {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("openGrowthRatChat"));
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("growthRatSendMessage", { detail: prompt })
      );
    }, 300);
  };

  // If children are provided, render as inline clickable (for "Ask me about this")
  if (children) {
    return (
      <button onClick={handleClick} className="inline">
        {children}
      </button>
    );
  }

  // Default: dark-background suggested prompt button
  return (
    <button
      onClick={handleClick}
      className="group flex items-center gap-3 w-full text-left text-sm px-4 py-3 rounded-lg border border-white/15 text-white/80 hover:bg-white/10 hover:border-white/30 transition-colors"
    >
      <span className="text-white/40 group-hover:text-[var(--color-gc-primary)] transition-colors">&rarr;</span>
      <span>&ldquo;{prompt}&rdquo;</span>
    </button>
  );
}
