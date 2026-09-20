export interface FeedSource {
  id: string;
  name: string;
  url: string;
  platform: 'web_forum' | 'reddit' | 'social';
  scope: 'lokal' | 'global';
  pillar: 'intersection' | 'gaming' | 'internet_culture';
  categoryLabel: string;
  isCustom?: boolean;
  isFocus?: boolean;
  createdAt?: string | number;
}

// All feeds are now stored in Firebase Firestore (per user).
// This array is kept empty — do not add hardcoded feeds here.
export const DEFAULT_FEEDS: FeedSource[] = [];
