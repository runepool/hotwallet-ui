import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface AddressDisplayProps {
  address: string;
  maxLength?: number;
}

export function AddressDisplay({ address, maxLength = 12 }: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  if (!address) return null;

  // Shorten the address: first 6 chars + ... + last 6 chars
  const shortenAddress = (addr: string): string => {
    if (addr.length <= maxLength) return addr;
    const prefixLength = Math.floor(maxLength / 2);
    const suffixLength = Math.floor(maxLength / 2);
    return `${addr.substring(0, prefixLength)}...${addr.substring(addr.length - suffixLength)}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address', err);
    }
  };

  return (
    <div className="flex items-center h-full">
      <span className="text-sm font-mono mr-2 text-blue-700">{shortenAddress(address)}</span>
      <button
        onClick={handleCopy}
        className="flex items-center justify-center h-5 w-5 rounded-md hover:bg-blue-100 transition-colors"
        title={copied ? 'Copied!' : 'Copy address'}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4 text-blue-700" />
        )}
      </button>
    </div>
  );
}
