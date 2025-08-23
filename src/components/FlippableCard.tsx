import { motion } from "framer-motion";

type Props = {
  isFlipped: boolean;
  frontImg: string;
  backImg: string;
  onClick: () => void;
};

export default function FlippableCard({ isFlipped, frontImg, backImg, onClick }: Props) {
  return (
    <div
      className="relative w-full aspect-[2/3] cursor-pointer"
      style={{ perspective: "1000px" }}
      onClick={onClick}
    >
      <motion.div
        className="relative w-full h-full transition-transform duration-700"
        style={{ transformStyle: "preserve-3d" }}
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Voorkant (dichte kaart) */}
        <div
          className="absolute w-full h-full rounded-lg overflow-hidden shadow-lg"
          style={{ backfaceVisibility: "hidden" }}
        >
          <img src={backImg} alt="Card back" className="w-full h-full object-cover" />
        </div>
        {/* Achterkant (open kaart) */}
        <div
          className="absolute w-full h-full rounded-lg overflow-hidden shadow-lg"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <img src={frontImg} alt="Card front" className="w-full h-full object-cover" />
        </div>
      </motion.div>
    </div>
  );
}