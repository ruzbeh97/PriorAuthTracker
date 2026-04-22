import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  className?: string;
}

export default function CopyButton({ text, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className={`shrink-0 hover:text-primary transition-colors relative ${className}`}
    >
      {copied ? (
        <Check className="w-3 h-3 text-status-active" strokeWidth={2} />
      ) : (
        <Copy className="w-3 h-3 text-text-secondary" strokeWidth={1.5} />
      )}
    </button>
  );
}
