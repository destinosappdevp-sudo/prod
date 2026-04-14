import { Fragment, ReactNode } from "react";

interface FormattedDescriptionProps {
  text?: string | null;
  className?: string;
}

function renderInlineBold(content: string): ReactNode[] {
  const tokens = content.split(/(\*\*[^*]+\*\*)/g);

  return tokens.map((token, idx) => {
    if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      return <strong key={`${token}-${idx}`}>{token.slice(2, -2)}</strong>;
    }

    return <Fragment key={`${token}-${idx}`}>{token}</Fragment>;
  });
}

export default function FormattedDescription({
  text,
  className = "",
}: FormattedDescriptionProps) {
  if (!text) return null;

  const lines = text.split(/\r?\n/);

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {lines.map((rawLine, idx) => {
        const centered = rawLine.match(/^\[center\](.*)\[\/center\]$/i);
        const line = centered ? centered[1] : rawLine;

        if (line.length === 0) {
          return <div key={`empty-${idx}`} className="h-5" aria-hidden="true" />;
        }

        return (
          <p key={`line-${idx}`} className={centered ? "text-center" : undefined}>
            {renderInlineBold(line)}
          </p>
        );
      })}
    </div>
  );
}