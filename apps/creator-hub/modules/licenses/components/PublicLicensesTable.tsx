import { FunctionComponent } from 'react';

import ExploreLicensesEmptyState from './ExploreLicensesEmptyState';

/** Placeholder until the public licenses table ships; reuses the explore empty state. */
const PublicLicensesTable: FunctionComponent = () => (
  <div data-testid='public-licenses-table-placeholder'>
    <ExploreLicensesEmptyState />
  </div>
);

export default PublicLicensesTable;
