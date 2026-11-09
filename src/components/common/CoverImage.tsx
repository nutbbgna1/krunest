import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';

interface Props {
  src?: string | null;
  alt: string;
  className?: string;
  eager?: boolean;
}

export function CoverImage({ src, alt, className = '', eager = false }: Props) {
  const [attempt, setAttempt] = useState(0);

  useEffect(() => setAttempt(0), [src]);

  if (!src || attempt > 1) {
    return <div className={`grid place-items-center bg-slate-100 text-slate-400 ${className}`} role="img" aria-label={alt}>
      <span className="flex flex-col items-center gap-2 px-3 text-center text-xs font-bold"><ImageOff className="h-8 w-8"/>ไม่สามารถโหลดรูปปกได้</span>
    </div>;
  }

  const retrySrc = attempt === 0 ? src : `${src}${src.includes('?') ? '&' : '?'}cover_retry=1`;
  return <img
    key={retrySrc}
    src={retrySrc}
    alt={alt}
    className={className}
    loading={eager ? 'eager' : 'lazy'}
    decoding="async"
    fetchPriority={eager ? 'high' : 'low'}
    onError={() => setAttempt((value) => value + 1)}
  />;
}
