import { Fragment } from "react";

/** Minimal renderer for the constrained markdown the assistant returns. */
export function AiMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((raw, index) => {
        const line = raw.trim();
        if (!line) return <Fragment key={index} />;

        if (line.startsWith("## ")) {
          return (
            <h3 key={index} className="pt-2 text-sm font-semibold uppercase tracking-wide text-primary">
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h3 key={index} className="pt-2 text-base font-semibold text-foreground">
              {line.slice(2)}
            </h3>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <p key={index} className="flex gap-2 text-sm text-foreground">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{inline(line.slice(2))}</span>
            </p>
          );
        }
        return (
          <p key={index} className="text-sm leading-relaxed text-foreground">
            {inline(line)}
          </p>
        );
      })}
    </div>
  );
}

function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="text-muted-foreground">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}
