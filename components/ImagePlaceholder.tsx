import { ImageIcon } from "lucide-react";

export default function ImagePlaceholder({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`w-full h-full min-h-[220px] flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary-100 rounded-xl bg-primary-50/50 text-center px-4 ${className}`}
    >
      <ImageIcon size={26} className="text-primary-700/50" />
      <p className="text-xs font-medium text-primary-800/70">{label}</p>
    </div>
  );
}