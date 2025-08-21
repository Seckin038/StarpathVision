import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // Ensure this path is correct

export type TarotDeckCard = { id: string; name: string; imageUrl?: string };

function publicUrl(path?: string) {
  if (!path) return undefined;
  // Bucketnaam die je gebruikte voor kaartafbeeldingen:
  const { data } = supabase.storage.from("tarot-cards").getPublicUrl(path); // Assuming 'tarot-cards' is your bucket name
  return data.publicUrl;
}

export function useTarotDeck(locale: "nl" | "en" | "tr") {
  const [deck, setDeck] = useState<TarotDeckCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Probeer DB eerst
        const { data, error } = await supabase
          .from("tarot_cards")
          .select("id, image_url, code, name_nl, name_en, name_tr") // Added 'code' for consistent ID
          .order("code", { ascending: true }); // Order by code for consistent deck order

        if (!error && data && data.length) {
          const rows = data.map((r: any) => ({
            id: r.id || r.code, // Use id or code as a fallback
            name: r[`name_${locale}`] || r.name_en || r.code,
            imageUrl: r.image_url?.startsWith("http")
              ? r.image_url
              : publicUrl(r.image_url), // Assuming image_url might be a path in storage
          }));
          setDeck(rows);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Failed to load deck from DB, falling back to JSON:", e);
        /* negeer, we vallen terug op JSON */
      }

      // Fallback: oude JSON
      try {
        const res = await fetch(`/tarot/cards.${locale}.json`);
        const json = await res.json();
        setDeck(
          json.map((c: any) => ({
            id: c.id,
            name: c.name,
            imageUrl: c.image ? `/tarot/${c.image}` : undefined,
          }))
        );
      } catch (e) {
        console.error("Failed to load deck from JSON fallback:", e);
        // Fallback to placeholder deck if JSON also fails
        const majors = [
          'The Fool','The Magician','The High Priestess','The Empress','The Emperor','The Hierophant','The Lovers','The Chariot','Strength','The Hermit','Wheel of Fortune','Justice','The Hanged Man','Death','Temperance','The Devil','The Tower','The Star','The Moon','The Sun','Judgement','The World',
        ].map((name, i) => ({ id:`MAJOR_${i+1}`, name, imageUrl:undefined }));
        const suits = ['Wands','Cups','Swords','Pentacles'];
        const ranks = ['Ace','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Page','Knight','Queen','King'];
        const minors:any[] = [];
        suits.forEach(s => ranks.forEach((r,ri)=> minors.push({ id:`${s}_${r}`, name:`${r} of ${s}`, imageUrl:undefined })));
        setDeck([...majors, ...minors]); // 22 + 56 = 78
      }
      setLoading(false);
    })();
  }, [locale]);

  return { deck, loading };
}