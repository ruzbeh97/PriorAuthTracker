import { useState, useRef } from 'react';
import { Globe, ExternalLink, X, ArrowRight } from 'lucide-react';

interface PortalBrowserProps {
  initialUrl: string;
  title: string;
  onClose: () => void;
}

export default function PortalBrowser({ initialUrl, title, onClose }: PortalBrowserProps) {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [addressValue, setAddressValue] = useState(initialUrl);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const navigateTo = (input: string) => {
    let url = input.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      if (/^[a-z0-9-]+\.[a-z]{2,}/i.test(url)) {
        url = `https://${url}`;
      } else {
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
    }
    setCurrentUrl(url);
    setAddressValue(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') navigateTo(addressValue);
  };

  return (
    <div className="w-[520px] bg-white border-l border-outline flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-outline shrink-0">
        <Globe className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
        <span className="text-xs font-medium text-text-primary whitespace-nowrap shrink-0">{title}</span>
        <div className="flex-1" />
        <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-surface-variant transition-colors shrink-0" title="Open in new tab">
          <ExternalLink className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.5} />
        </a>
        <button onClick={onClose} className="p-1 rounded hover:bg-surface-variant transition-colors shrink-0">
          <X className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-outline shrink-0 bg-[#f5f5f5]">
        <div className="flex-1 flex items-center bg-white border border-outline rounded-full overflow-hidden">
          <input
            type="text"
            value={addressValue}
            onChange={(e) => setAddressValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or enter URL"
            className="flex-1 min-w-0 text-xs text-text-primary px-3 py-1.5 focus:outline-none bg-transparent"
          />
          <button
            onClick={() => navigateTo(addressValue)}
            className="p-1.5 hover:bg-surface-variant transition-colors shrink-0"
          >
            <ArrowRight className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#f5f5f5]">
        <iframe
          ref={iframeRef}
          src={currentUrl}
          title={title}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}
