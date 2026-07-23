import type { TProductKey } from '../types';

function isDashboard(product: TProductKey): boolean {
  return ['CreatorHub', 'Home', 'CreatorDashboard', 'RoadMap', 'Explore'].includes(product);
}

export default isDashboard;
