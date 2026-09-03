/* istanbul ignore file */
import type { ShopItem } from './types';

const WEAPONS = { id: 'cat-alpha-001', name: 'Weapons' };
const POTIONS = { id: 'cat-gamma-003', name: 'Potions' };

/**
 * Stand-in shop items for external-eligibility work, served when
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
  {
    id: '100004',
    name: 'Starter Coin Pack',
    thumbnailAssetId: 9000001,
    type: 'DeveloperProduct',
    isVisibleInShop: true,
    isExternallyEligible: false,
    category: WEAPONS,
  },
  {
    id: '100005',
    name: 'Mega Gem Bundle',
    thumbnailAssetId: 9000002,
    type: 'DeveloperProduct',
    isVisibleInShop: true,
    isExternallyEligible: false,
    category: POTIONS,
  },
  {
    id: '100006',
    name: 'Legendary Sword Skin',
    thumbnailAssetId: 9000003,
    type: 'DeveloperProduct',
    isVisibleInShop: true,
    isExternallyEligible: false,
    category: WEAPONS,
  },
  {
    id: '100007',
    name: 'Starter Coin Pack',
    thumbnailAssetId: 9000001,
    type: 'DeveloperProduct',
    isVisibleInShop: true,
    isExternallyEligible: false,
    category: WEAPONS,
  },
  {
    id: '100008',
    name: 'Mega Gem Bundle',
    thumbnailAssetId: 9000002,
    type: 'DeveloperProduct',
    isVisibleInShop: true,
    isExternallyEligible: false,
    category: POTIONS,
  },
  {
    id: '100009',
    name: 'Legendary Sword Skin',
    thumbnailAssetId: 9000003,
    type: 'DeveloperProduct',
    isVisibleInShop: true,
    isExternallyEligible: false,
    category: WEAPONS,
  },
  {
    id: '100011',
    name: 'Starter Coin Pack',
    thumbnailAssetId: 9000001,
    type: 'DeveloperProduct',
    isVisibleInShop: true,
    isExternallyEligible: false,
    category: WEAPONS,
  },
  {
    id: '100012',
    name: 'Mega Gem Bundle',
    thumbnailAssetId: 9000002,
    type: 'DeveloperProduct',
    isVisibleInShop: true,
    isExternallyEligible: false,
    category: POTIONS,
  },
  {
    id: '100010',
    name: 'Legendary Sword Skin',
    thumbnailAssetId: 9000003,
    type: 'DeveloperProduct',
    isVisibleInShop: true,
    isExternallyEligible: false,
    category: WEAPONS,
  },
];
