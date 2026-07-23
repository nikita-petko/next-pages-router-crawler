/* istanbul ignore file */
import type { HardCodedPriceInstance, HardCodedPriceSummary } from './types';

export const MOCK_HARD_CODED_PRICE_SUMMARY: HardCodedPriceSummary = {
  hasViolations: true,
  lastScanned: new Date('2026-04-02T06:30:00Z'),
};

// NOTE: these are AI-generated mock data for realism, not based on true user data.
export const MOCK_HARD_CODED_PRICE_INSTANCES: HardCodedPriceInstance[] = [
  {
    id: 1,
    iconAssetId: 137433746718166,
    filename: 'StarterGui/HUD/UpgradeTray/CTA.LocalScript',
    line: 38,
    codeSnippet: 'cta.Text = "Unlock blade — 325 tokens"',
    codeLanguage: 'lua',
    studioDeepLink: '',
  },
  {
    id: 2,
    iconAssetId: 137433746718166,
    filename: 'ServerScriptService/Commerce/WalletCheck.server.lua',
    line: 96,
    codeSnippet: 'if wallet:GetAttribute("Tokens") >= 275 then',
    codeLanguage: 'lua',
    studioDeepLink: '',
  },
  {
    id: 3,
    iconAssetId: 137433746718166,
    filename: 'ReplicatedStorage/Catalog/GearCosts.module.lua',
    line: 8,
    codeSnippet: 'return { Blade = 140, Buckler = 95, Helm = 72 }',
    codeLanguage: 'lua',
    studioDeepLink: '',
  },
  {
    id: 4,
    iconAssetId: 137433746718166,
    filename: 'StarterPlayer/StarterPlayerScripts/StoreFront.client.lua',
    line: 67,
    codeSnippet: 'row.Price.Text = string.format("%d R$", 199)',
    codeLanguage: 'lua',
    studioDeepLink: '',
  },
  {
    id: 5,
    iconAssetId: 137433746718166,
    filename: 'ServerScriptService/Passes/StarterPackGrant.server.lua',
    line: 204,
    codeSnippet:
      'if receiptInfo.CurrencyType == Enum.CurrencyType.Robux and receiptInfo.CurrencySpent == 399 then',
    codeLanguage: 'lua',
    studioDeepLink: '',
  },
  {
    id: 6,
    iconAssetId: 137433746718166,
    filename: 'SeasonPasses/RewardsConfig.module.lua',
    line: 31,
    codeSnippet: '{ tier = 4, rewardId = "xp_boost_3d", robuxSkip = 149 },',
    codeLanguage: 'lua',
    studioDeepLink: '',
  },
];
