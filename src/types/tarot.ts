export type Locale = 'nl' | 'en' | 'tr';

export type LocalizedString = {
  [key in Locale]: string;
};

export type SpreadPosition = {
  slot_key: string;
} & {
  [key in Locale]: string;
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
  image: string;
  [key: string]: any;
};

export type DrawnCard = {
  positionId: string;
  card: TarotCardData;
  isReversed: boolean;
};