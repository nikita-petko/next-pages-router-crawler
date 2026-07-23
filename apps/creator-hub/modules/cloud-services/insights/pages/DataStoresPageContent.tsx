import type { FunctionComponent } from 'react';
import React from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import DataStoreAnalyticsContainer from '../components/DataStoreAnalyticsContainer';

const DataStoresPage: FunctionComponent = () => {
  return <DataStoreAnalyticsContainer />;
};

export default withTranslation(DataStoresPage, [TranslationNamespace.CloudServices]);
