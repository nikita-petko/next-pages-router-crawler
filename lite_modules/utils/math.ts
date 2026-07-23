import { round } from 'lodash';

export const RoundToTwoDecimals = (number: number) => round(number + Number.EPSILON, 2);
