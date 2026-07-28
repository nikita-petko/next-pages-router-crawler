/* istanbul ignore file */
import type {
  HardCodedPriceCodeReference,
  HardCodedPriceReference,
  HardCodedPriceSummary,
} from './types';
import { getFilenameFromPath } from './utils/getFilenameFromPath';

const createMockReference = (reference: HardCodedPriceCodeReference): HardCodedPriceReference => ({
  ...reference,
  filename: getFilenameFromPath(reference.path),
});

export const MOCK_HARD_CODED_PRICE_SUMMARY: HardCodedPriceSummary = {
  hasViolations: true,
  scanJobId: '1234567890',
  lastScanned: new Date('2026-04-02T06:30:00Z'),
};

// NOTE: these are AI-generated mock data for realism, not based on true user data.
export const MOCK_HARD_CODED_PRICE_INSTANCES: HardCodedPriceReference[] = [
  createMockReference({
    path: 'StarterGui/HUD/UpgradeTray/CTA.LocalScript',
    lineStart: 38,
    lineEnd: 38,
    snippet: 'cta.Text = "Unlock blade — 325 tokens"',
  }),
  createMockReference({
    path: 'ServerScriptService/Commerce/WalletCheck.server.lua',
    lineStart: 96,
    lineEnd: 96,
    snippet: 'if wallet:GetAttribute("Tokens") >= 275 then',
  }),
  createMockReference({
    path: 'ReplicatedStorage/Catalog/GearCosts.module.lua',
    lineStart: 8,
    lineEnd: 8,
    snippet: 'return { Blade = 140, Buckler = 95, Helm = 72 }',
  }),
  createMockReference({
    path: 'StarterPlayer/StarterPlayerScripts/StoreFront.client.lua',
    lineStart: 67,
    lineEnd: 67,
    snippet: 'row.Price.Text = string.format("%d R$", 199)',
  }),
  createMockReference({
    path: 'ServerScriptService/Passes/StarterPackGrant.server.lua',
    lineStart: 204,
    lineEnd: 204,
    snippet:
      'if receiptInfo.CurrencyType == Enum.CurrencyType.Robux and receiptInfo.CurrencySpent == 399 then',
  }),
  createMockReference({
    path: 'SeasonPasses/RewardsConfig.module.lua',
    lineStart: 31,
    lineEnd: 31,
    snippet: '{ tier = 4, rewardId = "xp_boost_3d", robuxSkip = 149 },',
  }),
];
