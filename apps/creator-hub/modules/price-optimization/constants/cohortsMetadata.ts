import { CohortMetadata } from '../types/experiment';

export const HOLDOUT_COMPARISON_COHORT = 'price100';

const cohortsMetadata: CohortMetadata[] = [
  {
    name: 'price75',
    priceChange: -0.25,
  },
  {
    name: 'price80',
    priceChange: -0.2,
  },
  {
    name: 'price85',
    priceChange: -0.15,
  },
  {
    name: 'price90',
    priceChange: -0.1,
  },
  {
    name: 'price95',
    priceChange: -0.05,
  },
  {
    name: 'price105',
    priceChange: 0.05,
  },
  {
    name: 'price110',
    priceChange: 0.1,
  },
  {
    name: 'price115',
    priceChange: 0.15,
  },
  {
    name: 'price120',
    priceChange: 0.2,
  },
  {
    name: 'price125',
    priceChange: 0.25,
  },
];

export default cohortsMetadata;
