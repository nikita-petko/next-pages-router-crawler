/* istanbul ignore file */
import type { ShopItem } from './types';

const WEAPONS = { id: 'cat-alpha-001', name: 'Weapons' };
const ARMOR = { id: 'cat-beta-002', name: 'Armor' };
const POTIONS = { id: 'cat-gamma-003', name: 'Potions' };

/**
 * Stand-in shop items for the ProcessReceipt external-eligibility work, served when
 * the `mockShopItemsExternalEligibility` flag is on. Covers every combination of
 * `isVisibleInShop` x `isExternallyEligible` so callers can exercise the report set
 * (listed + ineligible) without depending on shops-api sending the field.
 */
export const MOCK_SHOP_ITEMS: ShopItem[] = [
  {
    id: '100001',
    name: 'Starter Coin Pack',
    thumbnailAssetId: 9000001,
    type: 'DeveloperProduct',
    isVisibleInShop: true,
    isExternallyEligible: false,
    category: WEAPONS,
  },
  {
    id: '100002',
    name: 'Mega Gem Bundle',
    thumbnailAssetId: 9000002,
    type: 'DeveloperProduct',
    isVisibleInShop: true,
    isExternallyEligible: false,
    category: POTIONS,
  },
  {
    id: '100003',
    name: 'Legendary Sword Skin',
    thumbnailAssetId: 9000003,
    type: 'DeveloperProduct',
    isVisibleInShop: true,
    isExternallyEligible: false,
    category: WEAPONS,
  },
  // Listed and eligible: should never appear in the report.
  {
    id: '100004',
    name: 'Speed Boost Potion',
    thumbnailAssetId: 9000004,
    type: 'DeveloperProduct',
    isVisibleInShop: true,
    isExternallyEligible: true,
    category: POTIONS,
  },
  // Unlisted and ineligible: unlisted items are out of scope for the report.
  {
    id: '100005',
    name: 'Retired Founder Pack',
    thumbnailAssetId: 9000005,
    type: 'DeveloperProduct',
    isVisibleInShop: false,
    isExternallyEligible: false,
    category: ARMOR,
  },
  // Game passes resolve eligibility the same way, but are not creator-editable.
  {
    id: '200001',
    name: 'VIP Access Pass',
    thumbnailAssetId: 9000006,
    type: 'GamePass',
    isVisibleInShop: true,
    isExternallyEligible: false,
    category: ARMOR,
  },
  {
    id: '200002',
    name: 'Double XP Pass',
    thumbnailAssetId: 9000007,
    type: 'GamePass',
    isVisibleInShop: true,
    isExternallyEligible: true,
    category: POTIONS,
  },
];
