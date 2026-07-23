/* used to intercept network requests in the browser for testing purposes
 *  initialized in _app.tsx
 *  only used in development and testing environments */

// eslint-disable-next-line import/no-extraneous-dependencies
import { http, HttpResponse } from 'msw';

import { AdPlatform } from '@constants/ad';
import {
  ServerCampaignObjectiveType,
  ServerCampaignStatusType,
  ServerPaymentType,
} from '@constants/campaign';
import { Campaign } from '@type/campaign';
import { EntityPerformance } from '@type/reportingStats';

// Mock campaign for regular Roblox-only advertising
const robloxOnlyCampaign: Campaign = {
  ad_credit_budget: {},
  budget: {
    lifetime_budget_micro_usd: 5000000000, // $5,000
  },
  created_timestamp_ms: new Date('2025-01-10T08:00:00Z').getTime(),
  end_timestamp_ms: new Date('2025-06-10T08:00:00Z').getTime(),
  id: 'roblox-only-campaign',
  name: 'Roblox Only Campaign',
  objective: ServerCampaignObjectiveType.VISITS,
  payment_type: ServerPaymentType.PAYMENT_TYPE_CARD,
  performance: {
    click_count: 1250,
    cost_per_play_usd: 0.15,
    display_spending_usd: 125000000, // $1,250.00 in micro USD
    impression: 45620,
    payment_type: ServerPaymentType.PAYMENT_TYPE_CARD,
    play_count: 8330,
    total_play_time_hours_7d: 892.5,
    total_robux_revenue_30d: 67800,
  },
  start_timestamp_ms: new Date('2025-01-10T08:00:00Z').getTime(),
  status: ServerCampaignStatusType.ENABLED,
  universe_id: 87654321,
  // No off_platform_request_id - regular campaign
  updated_timestamp_ms: Date.now(),
};

// Mock campaign for off-platform advertising with performance metrics
const offPlatformWithMetricsCampaign: Campaign = {
  ad_credit_budget: {},
  budget: {
    lifetime_budget_micro_usd: 10000000000, // $10,000
  },
  created_timestamp_ms: new Date('2025-01-15T10:30:00Z').getTime(),
  end_timestamp_ms: new Date('2025-12-15T10:30:00Z').getTime(),
  id: 'off-platform-with-metrics',
  is_off_platform_request: true,
  is_reporting_enabled: true,
  name: 'Off-Platform Campaign (With Metrics)',
  objective: ServerCampaignObjectiveType.VISITS, // Using VISITS instead of ROAS since ROAS doesn't exist
  off_platform_request_id: 'off-platform-request-123',
  payment_type: ServerPaymentType.PAYMENT_TYPE_CARD,
  performance: {
    click_count: 5234,
    cost_per_play_usd: 0.25,
    display_spending_usd: 308500000, // $3,085.00 in micro USD
    impression: 125890,
    payment_type: ServerPaymentType.PAYMENT_TYPE_CARD,
    play_count: 12340,
    total_play_time_hours_7d: 2876.8,
    total_robux_revenue_30d: 234500,
  },
  start_timestamp_ms: new Date('2025-01-15T10:30:00Z').getTime(),
  status: ServerCampaignStatusType.ENABLED,
  universe_id: 12345678,
  updated_timestamp_ms: Date.now(),
};

// Mock campaign for off-platform advertising without metrics (tests platform column without data)
const offPlatformNoMetricsCampaign: Campaign = {
  ad_credit_budget: {},
  budget: {
    lifetime_budget_micro_usd: 8000000000, // $8,000
  },
  created_timestamp_ms: new Date('2025-01-20T14:00:00Z').getTime(),
  end_timestamp_ms: new Date('2025-11-20T14:00:00Z').getTime(),
  id: 'off-platform-no-metrics',
  is_off_platform_request: true,
  is_reporting_enabled: false,
  name: 'Off-Platform Campaign (No Metrics)',
  objective: ServerCampaignObjectiveType.VISITS, // Using VISITS instead of the incorrect CAMPAIGN_OBJECTIVE_TYPE_VISIT
  off_platform_request_id: 'off-platform-request-456',
  payment_type: ServerPaymentType.PAYMENT_TYPE_CARD,
  performance: {
    click_count: 2100,
    cost_per_play_usd: 0.18,
    display_spending_usd: 189000000, // $1,890.00 in micro USD
    impression: 67200,
    payment_type: ServerPaymentType.PAYMENT_TYPE_CARD,
    play_count: 10500,
    total_play_time_hours_7d: 1543.2,
    total_robux_revenue_30d: 134200,
  },
  start_timestamp_ms: new Date('2025-01-20T14:00:00Z').getTime(),
  status: ServerCampaignStatusType.ENABLED,
  universe_id: 56789012,
  updated_timestamp_ms: Date.now(),
};

// Mock off-platform performance data (only returned for campaigns with metrics)
const mockOffPlatformPerformance: Record<string, EntityPerformance> = {
  [AdPlatform.GOOGLE]: {
    click_count: 12500,
    cost_per_play_usd: 0.195, // $0.195 CPP
    display_spending_usd: 246015000, // $2,460.15 in micro USD
    impression: 40126,
    payment_type: ServerPaymentType.PAYMENT_TYPE_CARD,
    play_count: 12615,
    total_play_time_hours_7d: 1250.5,
    total_robux_revenue_30d: 89500,
  },
  [AdPlatform.META]: {
    click_count: 5200,
    cost_per_play_usd: 0.425, // $0.425 CPP
    display_spending_usd: 89250000, // $892.50 in micro USD
    impression: 24890,
    payment_type: ServerPaymentType.PAYMENT_TYPE_CARD,
    play_count: 2100,
    total_play_time_hours_7d: 456.8,
    total_robux_revenue_30d: 45800,
  },
  [AdPlatform.SNAPCHAT]: {
    click_count: 3150,
    cost_per_play_usd: 0.278, // $0.278 CPP
    display_spending_usd: 52500000, // $525.00 in micro USD
    impression: 18750,
    payment_type: ServerPaymentType.PAYMENT_TYPE_CARD,
    play_count: 1890,
    total_play_time_hours_7d: 234.2,
    total_robux_revenue_30d: 28900,
  },
  [AdPlatform.TIKTOK]: {
    click_count: 8750,
    cost_per_play_usd: 0.339, // $0.339 CPP
    display_spending_usd: 136056000, // $1,360.56 in micro USD
    impression: 40126,
    payment_type: ServerPaymentType.PAYMENT_TYPE_CARD,
    play_count: 4015,
    total_play_time_hours_7d: 892.3,
    total_robux_revenue_30d: 67200,
  },
};

const mockAds = [
  {
    id: 'mock-ad-1',
    name: 'Dragon Adventures Ad 1',
    performance: {
      click_count: 1234,
      cost_per_play_usd: 0.18,
      display_spending_usd: 25000000, // $250.00 in micro USD
      impression: 12340,
      payment_type: ServerPaymentType.PAYMENT_TYPE_CARD,
      play_count: 1389,
      total_play_time_hours_7d: 234.5,
      total_robux_revenue_30d: 15600,
    },
    sponsored_universe_ad_metadata: {
      asset_metadata: {
        asset_id: 13579246810,
      },
    },
    updated_timestamp_ms: Date.now(),
  },
  {
    id: 'mock-ad-2',
    name: 'Dragon Adventures Ad 2',
    performance: {
      click_count: 987,
      cost_per_play_usd: 0.22,
      display_spending_usd: 18000000, // $180.00 in micro USD
      impression: 9870,
      payment_type: ServerPaymentType.PAYMENT_TYPE_CARD,
      play_count: 818,
      total_play_time_hours_7d: 167.2,
      total_robux_revenue_30d: 12400,
    },
    sponsored_universe_ad_metadata: {
      asset_metadata: {
        asset_id: 24681357920,
      },
    },
    updated_timestamp_ms: Date.now(),
  },
  {
    id: 'mock-ad-3',
    name: 'Dragon Adventures Ad 3',
    performance: {
      click_count: 2156,
      cost_per_play_usd: 0.14,
      display_spending_usd: 42000000, // $420.00 in micro USD
      impression: 21560,
      payment_type: 'USD',
      play_count: 3000,
      total_play_time_hours_7d: 512.8,
      total_robux_revenue_30d: 28900,
    },
    sponsored_universe_ad_metadata: {
      asset_metadata: {
        asset_id: 97531864200,
      },
    },
    updated_timestamp_ms: Date.now(),
  },
];

export const mockHandlers = [
  http.get(
    `*/ads-management-api/v2/native/campaigns/${offPlatformWithMetricsCampaign.id}?include_off_platform_performance=true`,
    () =>
      HttpResponse.json({
        campaign: offPlatformWithMetricsCampaign,
        off_platform_performance: mockOffPlatformPerformance,
      }),
  ),

  http.get(
    `*/ads-management-api/v2/native/campaigns/${offPlatformNoMetricsCampaign.id}?include_off_platform_performance=true`,
    () =>
      HttpResponse.json({ campaign: offPlatformNoMetricsCampaign, off_platform_performance: {} }),
  ),

  http.post('*/ads-management-api/v2/native/ads/dateFilter*', async ({ request }) => {
    const requestBody = (await request.clone().json()) as { campaign_ids: string[] };
    if (
      requestBody?.campaign_ids?.includes(offPlatformWithMetricsCampaign.id) ||
      requestBody?.campaign_ids?.includes(offPlatformNoMetricsCampaign.id)
    ) {
      return HttpResponse.json({ ads: [], nextCursor: '' });
    }
    return HttpResponse.json({ ads: mockAds, nextCursor: '' });
  }),

  http.post('*/ads-management-api/v2/native/ads/dateFilter*', () =>
    HttpResponse.json({ ads: mockAds, nextCursor: '' }),
  ),

  // Mock advertised universes endpoint (required for manage page)
  http.get('*/ads-management-api/v2/native/advertisedUniverses', () => {
    const response = {
      advertised_universes: [
        {
          universe_id: 12345678,
          universe_name: 'Dragon Adventures',
        },
        {
          universe_id: 87654321,
          universe_name: 'Test Universe',
        },
      ],
    };
    return HttpResponse.json(response);
  }),

  // Mock campaigns dateFilter endpoint (native API used by store) - THE KEY ONE!
  http.get('*/ads-management-api/v2/native/campaigns/dateFilter*', () => {
    const response = {
      campaigns: [robloxOnlyCampaign, offPlatformWithMetricsCampaign, offPlatformNoMetricsCampaign],
      next_cursor: null,
    };
    return HttpResponse.json(response);
  }),

  // Mock ad account summary endpoint (required for manage page)
  http.get('*/ads-management-api/v2/native/adAccountSummary/dateFilter*', () => {
    const response = {
      total_ad_spend_usd: 500000000, // $5,000 in micro USD
      total_clicks: 12500,
      total_impressions: 150000,
      total_play_time_hours_7d: 3456.7,
      total_plays: 25000,
      total_robux_revenue_30d: 345600,
    };
    return HttpResponse.json(response);
  }),
];
