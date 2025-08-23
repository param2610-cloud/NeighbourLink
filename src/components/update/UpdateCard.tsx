import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UpdateWithUserData } from '@/interface/main';
import { formatDistanceToNow } from 'date-fns';
import { ImageDisplay } from '@/utils/cloudinary/CloudinaryDisplay';

interface UpdateCardProps {
  update: UpdateWithUserData;
  isReply?: boolean;
}

const UpdateCard: React.FC<UpdateCardProps> = ({ update, isReply = false }) => {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  return (
    <article className="group transition-transform transform hover:-translate-y-1 hover:shadow-2xl rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/30">
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-400" aria-hidden />

      <div className="p-4 md:p-5 bg-transparent">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full overflow-hidden ring-1 ring-white/10 bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              {update.userData?.photoURL ? (
                <ImageDisplay publicId={update.userData.photoURL} className="h-12 w-12 object-cover" />
              ) : (
                <span className="text-indigo-700 dark:text-indigo-300 font-semibold">{update.userData?.firstName?.[0] || '?'}</span>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="truncate">
                <p className="text-sm font-semibold text-white truncate">
                  {update.userData?.firstName} {update.userData?.lastName || ''}
                </p>
                <p className="text-xs text-slate-300/80">{formatDate(update.createdAt)}</p>
              </div>
              <div className="ml-3 text-xs text-slate-300/80">{!isReply && update.replyCount !== undefined ? `${update.replyCount} ${update.replyCount === 1 ? 'reply' : 'replies'}` : ''}</div>
            </div>

            {update.title && (
              <h3 className="mt-3 text-lg font-bold text-white leading-tight">{update.title}</h3>
            )}

            {update.description && (
              <p className="mt-2 text-sm text-slate-300/90 leading-relaxed">{update.description}</p>
            )}

            {update.images && update.images.length > 0 && (
              <Gallery images={update.images} />
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-300/80">
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 hover:bg-white/8 transition text-slate-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v8l-4-2-4 2-4-2-4 2V10a2 2 0 012-2h2"/></svg>
              Share
            </button>
            <button className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 hover:bg-white/8 transition text-slate-200">
              Reply
            </button>
          </div>
          <div className="text-[11px] text-slate-400">{new Date(update.createdAt?.toDate ? update.createdAt.toDate() : update.createdAt || Date.now()).toLocaleString()}</div>
        </div>
      </div>
    </article>
  );
};

export default UpdateCard;

// --- Gallery component (local) ---
const Gallery: React.FC<{ images: string[] }> = ({ images }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const openAt = useCallback((i: number) => {
    setIndex(i);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const next = useCallback(() => setIndex(i => (i + 1) % images.length), [images.length]);
  const prev = useCallback(() => setIndex(i => (i - 1 + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, close, next, prev]);

  // single image
  if (images.length === 1) {
    return (
      <div className="mt-4 rounded-lg overflow-hidden bg-slate-700/40" onClick={() => openAt(0)}>
        <ImageDisplay publicId={images[0]} className="w-full h-48 object-cover cursor-pointer" />
      </div>
    );
  }

  // two images
  if (images.length === 2) {
    return (
      <div className="mt-4 grid grid-cols-2 gap-2">
        {images.map((img, i) => (
          <div key={i} className="rounded-lg overflow-hidden bg-slate-700/40" onClick={() => openAt(i)}>
            <ImageDisplay publicId={img} className="w-full h-40 object-cover cursor-pointer" />
          </div>
        ))}
      </div>
    );
  }

  const remaining = images.length - 1;

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg overflow-hidden bg-slate-700/40" onClick={() => openAt(0)}>
          <ImageDisplay publicId={images[0]} className="w-full h-48 object-cover cursor-pointer" />
        </div>
        <div className="rounded-lg overflow-hidden relative bg-slate-700/40" onClick={() => openAt(1)}>
          <ImageDisplay publicId={images[1]} className="w-full h-48 object-cover cursor-pointer" />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-lg font-semibold">
            +{remaining}
          </div>
        </div>
      </div>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={close}>
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={close} aria-label="Close" className="absolute top-3 right-3 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full p-2">✕</button>
            <div className="rounded-lg overflow-hidden bg-slate-900">
              <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 160px)' }}>
                <ImageDisplay publicId={images[index]} className="max-h-full max-w-full object-contain" />
                <button onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous" className="absolute left-6 text-white bg-black/40 hover:bg-black/50 rounded-full p-2 z-50">‹</button>
                <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next" className="absolute right-6 text-white bg-black/40 hover:bg-black/50 rounded-full p-2 z-50">›</button>
              </div>
              <div className="p-3 bg-slate-800 flex items-center justify-between text-sm text-slate-300">
                <div>{index + 1} / {images.length}</div>
                <div className="flex gap-2 overflow-auto">
                  {images.map((img, i) => (
                    <button key={i} onClick={(e) => { e.stopPropagation(); setIndex(i); }} className={`w-12 h-8 rounded overflow-hidden border ${i === index ? 'ring-2 ring-blue-400' : 'border-transparent'}`}>
                      <ImageDisplay publicId={img} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
