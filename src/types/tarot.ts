export type Locale = 'nl' | 'en' | 'tr';

export type LocalizedString = {
  [key in Locale]: string;
};

export type SpreadPosition = {
  slot_key: string;
  idx: number;
  x: number;
  y: number;
  rot: number;
  title: LocalizedString;
  upright_copy: LocalizedString;
  reversed_copy: LocalizedString;
};

export type SpreadLayout = {
  kind: 'line' | 'cross' | 'star' | 'horseshoe' | 'circle' | 'grid' | 'tree' | 'rows' | 'wheel' | 'pentagram';
  params?: {
    rows?: number;
    cols?: number;
    radius?: number;
  };
};

export type Spread = {
  id: string;
  module: 'tarot';
  deck: 'RWS' | 'Thoth' | 'Marseille' | 'custom';
  name: LocalizedString;
  cards_required: number;
  allow_reversals: boolean;
  layout: SpreadLayout;
  positions: SpreadPosition[];
  ui_copy: {
    [key in Locale]: {
      title: string;
      subtitle: string;
    };
  };
  tags: string[];
};

export type TarotCardData = {
  id: string;
  name: string;
  imageUrl?: string; // Changed from 'image' to 'imageUrl'
  [key: string]: any;
};

export type DrawnCard = {
  positionId: string;
  card: TarotCardData;
  isReversed: boolean;
};