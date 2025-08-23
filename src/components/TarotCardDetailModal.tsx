import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TarotDeckCard } from "@/hooks/useTarotDeck";
import { useTranslation } from "react-i18next";

type Props = {
  card: TarotDeckCard | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function TarotCardDetailModal({ card, isOpen, onClose }: Props) {
  const { t } = useTranslation();
  if (!card) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-stone-950/80 backdrop-blur-lg border-stone-800 text-stone-200">
        <DialogHeader>
          <DialogTitle className="text-3xl font-serif text-amber-200">{card.name}</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6 py-4">
          <div className="flex justify-center items-center">
            <img
              src={card.imageUrl || "/tarot/back.svg"}
              alt={card.name}
              className="w-full max-w-[250px] h-auto rounded-xl border-2 border-stone-700 shadow-lg shadow-black/50"
            />
          </div>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <h3 className="font-semibold text-amber-300 text-lg mb-1">{t('tarot.upright')}</h3>
              <DialogDescription className="text-stone-300 whitespace-pre-line">
                {card.meaning_up || t('tarot.noMeaningAvailable')}
              </DialogDescription>
            </div>
            <div>
              <h3 className="font-semibold text-rose-300 text-lg mb-1">{t('tarot.reversed')}</h3>
              <DialogDescription className="text-stone-300 whitespace-pre-line">
                {card.meaning_rev || t('tarot.noMeaningAvailable')}
              </DialogDescription>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}