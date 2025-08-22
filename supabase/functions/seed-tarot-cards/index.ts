// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function env(k: string) {
  const v = Deno.env.get(k);
  if (!v) throw new Error(`Missing env var: ${k}`);
  return v;
}

// Data for all 78 Rider-Waite-Smith cards
const CARDS_DATA = [
  // Major Arcana
  { id: "maj00", name: "De Dwaas", number: 0, arcana: "Major Arcana", suit: null, meaning_up: "Nieuw begin, onschuld, spontaniteit.", meaning_rev: "Roekeloosheid, risico's nemen.", keywords: ["begin", "onschuld", "vrijheid"] },
  { id: "maj01", name: "De Magiër", number: 1, arcana: "Major Arcana", suit: null, meaning_up: "Manifestatie, wilskracht, creativiteit.", meaning_rev: "Manipulatie, onbenut potentieel.", keywords: ["wilskracht", "creatie", "macht"] },
  { id: "maj02", name: "De Hogepriesteres", number: 2, arcana: "Major Arcana", suit: null, meaning_up: "Intuïtie, onderbewustzijn, mysterie.", meaning_rev: "Geheimen, verborgen agenda's.", keywords: ["intuïtie", "geheimen", "wijsheid"] },
  { id: "maj03", name: "De Keizerin", number: 3, arcana: "Major Arcana", suit: null, meaning_up: "Vruchtbaarheid, vrouwelijkheid, overvloed.", meaning_rev: "Creatieve blokkade, afhankelijkheid.", keywords: ["vruchtbaarheid", "natuur", "zorg"] },
  { id: "maj04", name: "De Keizer", number: 4, arcana: "Major Arcana", suit: null, meaning_up: "Autoriteit, structuur, controle.", meaning_rev: "Dominantie, inflexibiliteit.", keywords: ["autoriteit", "structuur", "vaderschap"] },
  { id: "maj05", name: "De Hiërofant", number: 5, arcana: "Major Arcana", suit: null, meaning_up: "Traditie, conformiteit, spirituele wijsheid.", meaning_rev: "Rebellie, onconventionele ideeën.", keywords: ["traditie", "geloof", "instituties"] },
  { id: "maj06", name: "De Geliefden", number: 6, arcana: "Major Arcana", suit: null, meaning_up: "Liefde, harmonie, keuzes.", meaning_rev: "Disharmonie, verkeerde keuzes.", keywords: ["liefde", "relaties", "keuzes"] },
  { id: "maj07", name: "De Zegewagen", number: 7, arcana: "Major Arcana", suit: null, meaning_up: "Controle, wilskracht, overwinning.", meaning_rev: "Gebrek aan richting, agressie.", keywords: ["overwinning", "wilskracht", "actie"] },
  { id: "maj08", name: "Kracht", number: 8, arcana: "Major Arcana", suit: null, meaning_up: "Moed, compassie, innerlijke kracht.", meaning_rev: "Zwakheid, zelftwijfel.", keywords: ["kracht", "moed", "geduld"] },
  { id: "maj09", name: "De Kluizenaar", number: 9, arcana: "Major Arcana", suit: null, meaning_up: "Introspectie, zielsonderzoek, innerlijke leiding.", meaning_rev: "Isolatie, eenzaamheid.", keywords: ["introspectie", "wijsheid", "alleen zijn"] },
  { id: "maj10", name: "Het Rad van Fortuin", number: 10, arcana: "Major Arcana", suit: null, meaning_up: "Geluk, karma, levenscycli.", meaning_rev: "Pech, weerstand tegen verandering.", keywords: ["lot", "verandering", "cycli"] },
  { id: "maj11", name: "Gerechtigheid", number: 11, arcana: "Major Arcana", suit: null, meaning_up: "Eerlijkheid, waarheid, wet.", meaning_rev: "Oneerlijkheid, onbalans.", keywords: ["rechtvaardigheid", "waarheid", "karma"] },
  { id: "maj12", name: "De Gehangene", number: 12, arcana: "Major Arcana", suit: null, meaning_up: "Overgave, nieuw perspectief, loslaten.", meaning_rev: "Stagnatie, opoffering.", keywords: ["perspectief", "loslaten", "overgave"] },
  { id: "maj13", name: "De Dood", number: 13, arcana: "Major Arcana", suit: null, meaning_up: "Einde, transformatie, overgang.", meaning_rev: "Weerstand tegen verandering, stagnatie.", keywords: ["einde", "transformatie", "verandering"] },
  { id: "maj14", name: "Gematigdheid", number: 14, arcana: "Major Arcana", suit: null, meaning_up: "Balans, geduld, doel.", meaning_rev: "Onbalans, extremen.", keywords: ["balans", "geduld", "harmonie"] },
  { id: "maj15", name: "De Duivel", number: 15, arcana: "Major Arcana", suit: null, meaning_up: "Verslaving, materialisme, beperking.", meaning_rev: "Vrijheid, losbreken.", keywords: ["verslaving", "beperking", "verleiding"] },
  { id: "maj16", name: "De Toren", number: 16, arcana: "Major Arcana", suit: null, meaning_up: "Plotselinge verandering, openbaring, chaos.", meaning_rev: "Angst voor verandering, ramp vermijden.", keywords: ["chaos", "verandering", "openbaring"] },
  { id: "maj17", name: "De Ster", number: 17, arcana: "Major Arcana", suit: null, meaning_up: "Hoop, geloof, vernieuwing.", meaning_rev: "Wanhoop, ontmoediging.", keywords: ["hoop", "inspiratie", "spiritualiteit"] },
  { id: "maj18", name: "De Maan", number: 18, arcana: "Major Arcana", suit: null, meaning_up: "Illusie, angst, intuïtie.", meaning_rev: "Verwarring loslaten, waarheid.", keywords: ["illusie", "angst", "onderbewustzijn"] },
  { id: "maj19", name: "De Zon", number: 19, arcana: "Major Arcana", suit: null, meaning_up: "Succes, vitaliteit, positiviteit.", meaning_rev: "Innerlijk kind, pessimisme.", keywords: ["succes", "vreugde", "helderheid"] },
  { id: "maj20", name: "Het Oordeel", number: 20, arcana: "Major Arcana", suit: null, meaning_up: "Oordeel, wedergeboorte, innerlijke roeping.", meaning_rev: "Zelftwijfel, negeren van de roeping.", keywords: ["oordeel", "wedergeboorte", "vergeving"] },
  { id: "maj21", name: "De Wereld", number: 21, arcana: "Major Arcana", suit: null, meaning_up: "Voltooiing, integratie, vervulling.", meaning_rev: "Onvoltooide zaken, gebrek aan afsluiting.", keywords: ["voltooiing", "succes", "reizen"] },
  { id: "wan01", name: "Aas van Staven", number: 22, arcana: "Minor Arcana", suit: "Wands", meaning_up: "Inspiratie, nieuwe kansen.", meaning_rev: "Gebrek aan motivatie.", keywords: ["creativiteit", "begin", "potentieel"] },
  { id: "wan02", name: "Twee van Staven", number: 23, arcana: "Minor Arcana", suit: "Wands", meaning_up: "Toekomstplanning, beslissingen.", meaning_rev: "Angst voor het onbekende.", keywords: ["planning", "beslissing", "ontdekking"] },
  { id: "wan03", name: "Drie van Staven", number: 24, arcana: "Minor Arcana", suit: "Wands", meaning_up: "Uitbreiding, vooruitziende blik.", meaning_rev: "Obstakels, vertragingen.", keywords: ["expansie", "handel", "vooruitzicht"] },
  { id: "wan04", name: "Vier van Staven", number: 25, arcana: "Minor Arcana", suit: "Wands", meaning_up: "Viering, harmonie, thuis.", meaning_rev: "Onrust, transitie.", keywords: ["viering", "thuis", "gemeenschap"] },
  { id: "wan05", name: "Vijf van Staven", number: 26, arcana: "Minor Arcana", suit: "Wands", meaning_up: "Conflict, competitie.", meaning_rev: "Conflictvermijding, overeenkomst.", keywords: ["conflict", "competitie", "strijd"] },
  { id: "wan06", name: "Zes van Staven", number: 27, arcana: "Minor Arcana", suit: "Wands", meaning_up: "Overwinning, publieke erkenning.", meaning_rev: "Val van de troon, gebrek aan erkenning.", keywords: ["succes", "erkenning", "overwinning"] },
  { id: "wan07", name: "Zeven van Staven", number: 28, arcana: "Minor Arcana", suit: "Wands", meaning_up: "Uitdaging, volharding.", meaning_rev: "Opgeven, overweldigd.", keywords: ["verdediging", "uitdaging", "doorzettingsvermogen"] },
  { id: "wan08", name: "Acht van Staven", number: 29, arcana: "Minor Arcana", suit: "Wands", meaning_up: "Snelheid, actie, nieuws.", meaning_rev: "Vertraging, frustratie.", keywords: ["snelheid", "actie", "communicatie"] },
  { id: "wan09", name: "Negen van Staven", number: 30, arcana: "Minor Arcana", suit: "Wands", meaning_up: "Veerkracht, laatste verdediging.", meaning_rev: "Uitputting, opgeven.", keywords: ["veerkracht", "grenzen", "volharding"] },
  { id: "wan10", name: "Tien van Staven", number: 31, arcana: "Minor Arcana", suit: "Wands", meaning_up: "Last, verantwoordelijkheid.", meaning_rev: "Lasten loslaten, delegeren.", keywords: ["last", "verantwoordelijkheid", "stress"] },
  { id: "wan11", name: "Page van Staven", number: 32, arcana: "Minor Arcana", suit: "Wands", meaning_up: "Enthousiasme, verkenning.", meaning_rev: "Passiviteit, aarzeling.", keywords: ["enthousiasme", "ontdekking", "creativiteit"] },
  { id: "wan12", name: "Ridder van Staven", number: 33, arcana: "Minor Arcana", suit: "Wands", meaning_up: "Energie, passie, avontuur.", meaning_rev: "Impulsiviteit, roekeloosheid.", keywords: ["passie", "avontuur", "energie"] },
  { id: "wan13", name: "Koningin van Staven", number: 34, arcana: "Minor Arcana", suit: "Wands", meaning_up: "Moed, zelfvertrouwen, onafhankelijkheid.", meaning_rev: "Intimidatie, jaloezie.", keywords: ["zelfvertrouwen", "onafhankelijkheid", "charisma"] },
  { id: "wan14", name: "Koning van Staven", number: 35, arcana: "Minor Arcana", suit: "Wands", meaning_up: "Leiderschap, visie, actie.", meaning_rev: "Autoritair, impulsief.", keywords: ["leiderschap", "visie", "inspiratie"] },
  { id: "cup01", name: "Aas van Kelken", number: 36, arcana: "Minor Arcana", suit: "Cups", meaning_up: "Nieuwe liefde, emoties.", meaning_rev: "Onderdrukte emoties.", keywords: ["liefde", "emotie", "creativiteit"] },
  { id: "cup02", name: "Twee van Kelken", number: 37, arcana: "Minor Arcana", suit: "Cups", meaning_up: "Vereniging, partnerschap.", meaning_rev: "Onbalans, breuk.", keywords: ["partnerschap", "liefde", "verbinding"] },
  { id: "cup03", name: "Drie van Kelken", number: 38, arcana: "Minor Arcana", suit: "Cups", meaning_up: "Viering, vriendschap.", meaning_rev: "Roddel, isolatie.", keywords: ["viering", "vriendschap", "gemeenschap"] },
  { id: "cup04", name: "Vier van Kelken", number: 39, arcana: "Minor Arcana", suit: "Cups", meaning_up: "Apathie, contemplatie.", meaning_rev: "Nieuwe kansen, terugtrekking.", keywords: ["apathie", "meditatie", "onvrede"] },
  { id: "cup05", name: "Vijf van Kelken", number: 40, arcana: "Minor Arcana", suit: "Cups", meaning_up: "Verlies, spijt, verdriet.", meaning_rev: "Acceptatie, vergeving.", keywords: ["verlies", "spijt", "verdriet"] },
  { id: "cup06", name: "Zes van Kelken", number: 41, arcana: "Minor Arcana", suit: "Cups", meaning_up: "Nostalgie, jeugdherinneringen.", meaning_rev: "Vastzitten in het verleden.", keywords: ["nostalgie", "onschuld", "jeugd"] },
  { id: "cup07", name: "Zeven van Kelken", number: 42, arcana: "Minor Arcana", suit: "Cups", meaning_up: "Keuzes, illusies, dagdromen.", meaning_rev: "Heldere keuzes, realiteit.", keywords: ["keuzes", "illusies", "fantasie"] },
  { id: "cup08", name: "Acht van Kelken", number: 43, arcana: "Minor Arcana", suit: "Cups", meaning_up: "Weglopen, ontevredenheid.", meaning_rev: "Vastzitten, angst voor verandering.", keywords: ["weglopen", "zoektocht", "onthechting"] },
  { id: "cup09", name: "Negen van Kelken", number: 44, arcana: "Minor Arcana", suit: "Cups", meaning_up: "Wensvervulling, tevredenheid.", meaning_rev: "Ontevredenheid, materialisme.", keywords: ["tevredenheid", "vervulling", "wensen"] },
  { id: "cup10", name: "Tien van Kelken", number: 45, arcana: "Minor Arcana", suit: "Cups", meaning_up: "Harmonie, geluk, familie.", meaning_rev: "Gebroken gezin, disharmonie.", keywords: ["geluk", "familie", "harmonie"] },
  { id: "cup11", name: "Page van Kelken", number: 46, arcana: "Minor Arcana", suit: "Cups", meaning_up: "Creatieve kansen, intuïtie.", meaning_rev: "Creatieve blokkade, emotionele onvolwassenheid.", keywords: ["creativiteit", "intuïtie", "boodschap"] },
  { id: "cup12", name: "Ridder van Kelken", number: 47, arcana: "Minor Arcana", suit: "Cups", meaning_up: "Romantiek, charme, verbeelding.", meaning_rev: "Onrealistische dromen, humeurigheid.", keywords: ["romantiek", "charme", "verbeelding"] },
  { id: "cup13", name: "Koningin van Kelken", number: 48, arcana: "Minor Arcana", suit: "Cups", meaning_up: "Compassie, intuïtie, kalmte.", meaning_rev: "Emotionele onzekerheid, afhankelijkheid.", keywords: ["compassie", "intuïtie", "zorg"] },
  { id: "cup14", name: "Koning van Kelken", number: 49, arcana: "Minor Arcana", suit: "Cups", meaning_up: "Emotionele volwassenheid, controle.", meaning_rev: "Emotionele manipulatie, stemmingswisselingen.", keywords: ["emotionele balans", "mededogen", "diplomatie"] },
  { id: "swd01", name: "Aas van Zwaarden", number: 50, arcana: "Minor Arcana", suit: "Swords", meaning_up: "Doorbraak, helderheid.", meaning_rev: "Verwarring, chaos.", keywords: ["helderheid", "waarheid", "doorbraak"] },
  { id: "swd02", name: "Twee van Zwaarden", number: 51, arcana: "Minor Arcana", suit: "Swords", meaning_up: "Moeilijke keuze, impasse.", meaning_rev: "Besluiteloosheid, verwarring.", keywords: ["keuze", "impasse", "wapenstilstand"] },
  { id: "swd03", name: "Drie van Zwaarden", number: 52, arcana: "Minor Arcana", suit: "Swords", meaning_up: "Hartzeer, verdriet, verlies.", meaning_rev: "Herstel, vergeving.", keywords: ["hartzeer", "verdriet", "verlies"] },
  { id: "swd04", name: "Vier van Zwaarden", number: 53, arcana: "Minor Arcana", suit: "Swords", meaning_up: "Rust, herstel, contemplatie.", meaning_rev: "Stagnatie, uitputting.", keywords: ["rust", "herstel", "meditatie"] },
  { id: "swd05", name: "Vijf van Zwaarden", number: 54, arcana: "Minor Arcana", suit: "Swords", meaning_up: "Conflict, nederlaag.", meaning_rev: "Verzoening, einde van conflict.", keywords: ["conflict", "nederlaag", "verraad"] },
  { id: "swd06", name: "Zes van Zwaarden", number: 55, arcana: "Minor Arcana", suit: "Swords", meaning_up: "Overgang, weggaan.", meaning_rev: "Vastzitten, weerstand tegen verandering.", keywords: ["overgang", "reis", "loslaten"] },
  { id: "swd07", name: "Zeven van Zwaarden", number: 56, arcana: "Minor Arcana", suit: "Swords", meaning_up: "Verraad, bedrog, strategie.", meaning_rev: "Bekentenis, openheid.", keywords: ["bedrog", "strategie", "diefstal"] },
  { id: "swd08", name: "Acht van Zwaarden", number: 57, arcana: "Minor Arcana", suit: "Swords", meaning_up: "Beperking, zelfopgelegde gevangenschap.", meaning_rev: "Vrijheid, losbreken.", keywords: ["beperking", "isolatie", "slachtofferschap"] },
  { id: "swd09", name: "Negen van Zwaarden", number: 58, arcana: "Minor Arcana", suit: "Swords", meaning_up: "Angst, zorgen, nachtmerries.", meaning_rev: "Herstel, loslaten van angst.", keywords: ["angst", "zorgen", "wanhoop"] },
  { id: "swd10", name: "Tien van Zwaarden", number: 59, arcana: "Minor Arcana", suit: "Swords", meaning_up: "Pijnlijk einde, verraad.", meaning_rev: "Herstel, onvermijdelijk einde.", keywords: ["einde", "verraad", "verlies"] },
  { id: "swd11", name: "Page van Zwaarden", number: 60, arcana: "Minor Arcana", suit: "Swords", meaning_up: "Nieuwsgierigheid, nieuwe ideeën.", meaning_rev: "Roddel, haastige woorden.", keywords: ["nieuwsgierigheid", "ideeën", "communicatie"] },
  { id: "swd12", name: "Ridder van Zwaarden", number: 61, arcana: "Minor Arcana", suit: "Swords", meaning_up: "Ambitie, actie, snelheid.", meaning_rev: "Roekeloosheid, impulsiviteit.", keywords: ["ambitie", "actie", "snelheid"] },
  { id: "swd13", name: "Koningin van Zwaarden", number: 62, arcana: "Minor Arcana", suit: "Swords", meaning_up: "Onafhankelijkheid, helder denken.", meaning_rev: "Koude, kritische houding.", keywords: ["onafhankelijkheid", "intelligentie", "helderheid"] },
  { id: "swd14", name: "Koning van Zwaarden", number: 63, arcana: "Minor Arcana", suit: "Swords", meaning_up: "Intellectuele kracht, autoriteit.", meaning_rev: "Manipulatie, machtsmisbruik.", keywords: ["autoriteit", "intellect", "waarheid"] },
  { id: "pen01", name: "Aas van Pentakels", number: 64, arcana: "Minor Arcana", suit: "Pentacles", meaning_up: "Nieuwe kansen, welvaart.", meaning_rev: "Gemiste kansen.", keywords: ["welvaart", "manifestatie", "kans"] },
  { id: "pen02", name: "Twee van Pentakels", number: 65, arcana: "Minor Arcana", suit: "Pentacles", meaning_up: "Balans, prioriteiten stellen.", meaning_rev: "Onbalans, desorganisatie.", keywords: ["balans", "flexibiliteit", "prioriteiten"] },
  { id: "pen03", name: "Drie van Pentakels", number: 66, arcana: "Minor Arcana", suit: "Pentacles", meaning_up: "Teamwerk, samenwerking.", meaning_rev: "Gebrek aan teamwork.", keywords: ["teamwerk", "samenwerking", "vakmanschap"] },
  { id: "pen04", name: "Vier van Pentakels", number: 67, arcana: "Minor Arcana", suit: "Pentacles", meaning_up: "Controle, zekerheid, bezit.", meaning_rev: "Gierigheid, loslaten.", keywords: ["controle", "zekerheid", "bezit"] },
  { id: "pen05", name: "Vijf van Pentakels", number: 68, arcana: "Minor Arcana", suit: "Pentacles", meaning_up: "Armoede, tegenslag, isolatie.", meaning_rev: "Herstel, hulp zoeken.", keywords: ["armoede", "verlies", "isolatie"] },
  { id: "pen06", name: "Zes van Pentakels", number: 69, arcana: "Minor Arcana", suit: "Pentacles", meaning_up: "Vrijgevigheid, liefdadigheid.", meaning_rev: "Schuld, afhankelijkheid.", keywords: ["vrijgevigheid", "liefdadigheid", "balans"] },
  { id: "pen07", name: "Zeven van Pentakels", number: 70, arcana: "Minor Arcana", suit: "Pentacles", meaning_up: "Geduld, investering, oogst.", meaning_rev: "Gebrek aan resultaat, frustratie.", keywords: ["geduld", "investering", "groei"] },
  { id: "pen08", name: "Acht van Pentakels", number: 71, arcana: "Minor Arcana", suit: "Pentacles", meaning_up: "Vakmanschap, vaardigheid, toewijding.", meaning_rev: "Perfectionisme, repetitief werk.", keywords: ["vakmanschap", "toewijding", "vaardigheid"] },
  { id: "pen09", name: "Negen van Pentakels", number: 72, arcana: "Minor Arcana", suit: "Pentacles", meaning_up: "Onafhankelijkheid, luxe, succes.", meaning_rev: "Financiële afhankelijkheid.", keywords: ["onafhankelijkheid", "luxe", "succes"] },
  { id: "pen10", name: "Tien van Pentakels", number: 73, arcana: "Minor Arcana", suit: "Pentacles", meaning_up: "Rijkdom, familie, erfenis.", meaning_rev: "Financiële problemen, familieconflict.", keywords: ["rijkdom", "familie", "erfenis"] },
  { id: "pen11", name: "Page van Pentakels", number: 74, arcana: "Minor Arcana", suit: "Pentacles", meaning_up: "Nieuwe kansen, manifestatie.", meaning_rev: "Luiheid, uitstelgedrag.", keywords: ["manifestatie", "studie", "kans"] },
  { id: "pen12", name: "Ridder van Pentakels", number: 75, arcana: "Minor Arcana", suit: "Pentacles", meaning_up: "Efficiëntie, hard werk, routine.", meaning_rev: "Verveling, stagnatie.", keywords: ["hard werk", "routine", "betrouwbaarheid"] },
  { id: "pen13", name: "Koningin van Pentakels", number: 76, arcana: "Minor Arcana", suit: "Pentacles", meaning_up: "Zorgzaam, praktisch, nuchter.", meaning_rev: "Zelfzorg, financiële onafhankelijkheid.", keywords: ["zorgzaam", "praktisch", "welvaart"] },
  { id: "pen14", name: "Koning van Pentakels", number: 77, arcana: "Minor Arcana", suit: "Pentacles", meaning_up: "Rijkdom, succes, zekerheid.", meaning_rev: "Gierigheid, materialisme.", keywords: ["rijkdom", "succes", "zekerheid"] },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
    
    const { error } = await supabaseAdmin.from("tarot_cards").upsert(CARDS_DATA, {
      onConflict: 'id',
    });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ message: `${CARDS_DATA.length} cards seeded successfully.` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});