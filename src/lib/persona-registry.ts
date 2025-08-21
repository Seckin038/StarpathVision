import { supabase } from './supabaseClient';

export type Locale = 'nl' | 'en' | 'tr';
export type Method = 'tarot' | 'coffee' | 'astrology' | 'numerology' | 'dromen' | 'runen' | 'kruiden' | 'natuurlezen' | 'volkswijsheid' | 'strategie' | 'voorouders' | 'waterlezen' | 'kunst' | 'erecode' | 'onderbewuste' | 'patronen' | 'symboliek' | 'transformatie' | 'creativiteit' | 'innovatie' | 'levensvragen' | 'zelfreflectie';

// This will now be a cache for the personas from the database
let PERSONAE_CACHE: Record<string, any> = {};

export async function loadPersonas(forceRefresh = false) {
  if (Object.keys(PERSONAE_CACHE).length > 0 && !forceRefresh) {
    return PERSONAE_CACHE;
  }

  const { data, error } = await supabase.from('personas').select('*');
  
  if (error) {
    console.error("Error loading personas:", error);
    return {};
  }

  const personas: Record<string, any> = {};
  for (const p of data) {
    personas[p.id] = {
      id: p.id,
      display: p.display_name,
      methods: p.methods,
      style: p.style,
      premium: p.is_premium,
      // Add other fields as needed from the new table structure
    };
  }
  
  PERSONAE_CACHE = personas;
  return PERSONAE_CACHE;
}

export function getCachedPersonas() {
  return PERSONAE_CACHE;
}

export function gatePersonaMethod(personaId: string, method: Method, locale: Locale = 'nl'): string | null {
  const p = PERSONAE_CACHE[personaId];
  if (!p) return locale === 'nl' ? 'Onbekende waarzegger.' : locale === 'tr' ? 'Bilinmeyen yorumcu.' : 'Unknown seer.';
  
  if (!p.methods || !p.methods.includes(method)) {
    const name = p.display?.[locale] || p.display?.['nl'] || personaId;
    const methodTranslations = {
      nl: { tarot: 'tarot', coffee: 'koffiedik', astrology: 'astrologie', numerology: 'numerologie', dromen: 'droom' },
      en: { tarot: 'tarot', coffee: 'coffee', astrology: 'astrology', numerology: 'numerology', dromen: 'dream' },
      tr: { tarot: 'tarot', coffee: 'kahve', astrology: 'astroloji', numerology: 'numeroloji', dromen: 'rüya' },
    };
    const translatedMethod = (methodTranslations[locale] as any)[method] || method;
    
    if (locale === 'nl') return `${name} doet geen ${translatedMethod}-lezingen.`;
    if (locale === 'tr') return `${name} ${translatedMethod} okumaları yapmaz.`;
    return `${name} does not perform ${method} readings.`;
  }
  
  return null;
}