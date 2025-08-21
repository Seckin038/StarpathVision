import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import MarkdownRenderer from "./MarkdownRenderer";
import Prose from "./Prose";

export default function ReadingPanel({
  title = "Je lezing",
  tldr,           // string[] | undefined
  body,           // string (AI output)
}: { title?: string; tldr?: string[]; body: string }) {
  return (
    <Card className="bg-stone-900/70 border-stone-800">
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <Sparkles className="h-5 w-5 text-amber-400 mt-1 flex-shrink-0" />
          <div className="space-y-4">
            <h3 className="font-semibold text-amber-200">{title}</h3>

            {Array.isArray(tldr) && tldr.length > 0 && (
              <div className="rounded-xl border border-amber-900/40 bg-amber-900/10 p-4">
                <div className="text-amber-200 font-medium mb-1">TL;DR</div>
                <Prose className="text-amber-100/90">
                  <ul className="mb-0">
                    {tldr.map((it, i) => <li key={i}>{it}</li>)}
                  </ul>
                </Prose>
              </div>
            )}

            <MarkdownRenderer text={body} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}