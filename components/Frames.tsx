import React from 'react';

interface FrameProps {
  label?: string;
  src?: string;
  alt?: string;
}

export function BrowserFrame({ label, src, alt }: FrameProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg bg-white">
      <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b border-gray-200">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
          <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
          <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
        </div>
        {label && <span className="text-xs text-gray-500 ml-2 truncate">{label}</span>}
      </div>
      <div className="relative aspect-video w-full overflow-hidden bg-gray-50">
        {src ? (
          <img src={src} alt={alt || label || "Browser screenshot"} className="w-full h-full object-cover" />
        ) : (
          <div className="p-4 text-xs text-gray-400">{label}</div>
        )}
      </div>
    </div>
  );
}

export function PhoneFrame({ label, src, alt }: FrameProps) {
  return (
    <div className="relative mx-auto border-gray-800 bg-gray-800 border-[12px] rounded-[2.5rem] h-[550px] w-[270px] shadow-xl">
      <div className="w-[120px] h-[18px] bg-gray-800 top-0 left-1/2 -translate-x-1/2 absolute rounded-b-[1rem] z-10" />
      <div className="rounded-[1.8rem] overflow-hidden w-full h-full bg-white relative">
        {src ? (
          <img src={src} alt={alt || label || "Phone screenshot"} className="w-full h-full object-cover" />
        ) : (
          <div className="p-4 text-xs text-gray-400 flex items-center justify-center h-full text-center">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}