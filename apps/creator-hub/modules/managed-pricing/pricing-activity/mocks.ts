/* istanbul ignore file */
import type { ManagedPricingEvent } from './types';

export const MOCK_PRICING_EVENTS: ManagedPricingEvent[] = [
  {
    type: 'price-test',
    externalId: '3e7a1125-0232-4610-9e23-78951e9bb407',
    startDate: new Date('2026-04-30'),
    endDate: null,
    status: 'upcoming',
    itemsUpdated: undefined,
    revenueImpactPermille: undefined,
  },
  {
    type: 'price-test',
    externalId: '0f52ae4c-8eef-4bf0-b8c2-b37088ddff9a',
    startDate: new Date('2026-01-08'),
    endDate: new Date('2026-01-15'),
    status: 'completed',
    itemsUpdated: 70,
    revenueImpactPermille: 101, // +10.1%
  },
  {
    type: 'price-test',
    externalId: '51bc4048-992e-40f4-b545-2ea387792fb6',
    startDate: new Date('2025-12-11'),
    endDate: new Date('2025-12-31'),
    status: 'completed',
    itemsUpdated: 0,
    revenueImpactPermille: 0, // no impact
  },
  {
    type: 'price-test',
    externalId: '23778646-1bfb-4801-bea8-307915ca4e5b',
    startDate: new Date('2025-11-01'),
    endDate: new Date('2025-11-10'),
    status: 'completed',
    itemsUpdated: 50,
    revenueImpactPermille: 1, // +0.1%
  },
  {
    type: 'price-test',
    externalId: '9b4f4c56-a0a8-49b1-9892-5d43b0004c7f',
    startDate: new Date('2025-06-20'),
    endDate: new Date('2025-06-29'),
    status: 'completed',
    itemsUpdated: 40,
    revenueImpactPermille: 42, // +4.2%
  },
  {
    type: 'price-test',
    externalId: 'e9f10f0b-f5ba-4c25-8f90-042fe6deadfb',
    startDate: new Date('2025-04-16'),
    endDate: new Date('2025-04-25'),
    status: 'completed',
    itemsUpdated: 30,
    revenueImpactPermille: 0, // no impact
  },
];

export default MOCK_PRICING_EVENTS;
