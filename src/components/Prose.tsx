import { cn } from "@/lib/utils";

export default function Prose(
  { className, children }:{ className?:string; children:React.ReactNode }
){
  return (
    <div
      className={cn(
        // maat & ritme
        "max-w-[68ch] text-[17px] md:text-[18px] leading-[1.8] tracking-[0.005em]",
        // kleur & contrast
        "text-stone-200",
        // spacing voor standaard elementen
        "[&>p]:mb-4 [&>p:last-child]:mb-0",
        "[&>h2]:text-amber-200 [&>h2]:mt-2 [&>h2]:mb-3 [&>h2]:text-xl [&>h2]:font-semibold",
        "[&>h3]:text-amber-200/90 [&>h3]:mt-3 [&>h3]:mb-2 [&>h3]:text-lg [&>h3]:font-semibold",
        "[&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-2 [&>ul]:mb-4",
        "[&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-2 [&>ol]:mb-4",
        "[&>blockquote]:border-l-4 [&>blockquote]:border-amber-700 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-stone-300 [&>blockquote]:mb-4",
        "[&>hr]:my-6 [&>hr]:border-stone-800",
        className
      )}
    >
      {children}
    </div>
  );
}