import type { FunctionComponent } from 'react';
import React from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import MemoryStoreAnalyticsContainer from '../components/MemoryStoreAnalyticsContainer';

const MemoryStoresPage: FunctionComponent = () => {
  return <MemoryStoreAnalyticsContainer />;
};

export default withTranslation(MemoryStoresPage, [TranslationNamespace.CloudServices]);
