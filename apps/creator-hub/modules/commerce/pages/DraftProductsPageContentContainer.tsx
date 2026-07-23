import React, { FunctionComponent } from 'react';
import PageContentContainer from './PageContentContainer';
import DraftProductsPageContent from './DraftProductsPageContent';

const DraftProductsContentContainer: FunctionComponent = () => {
  return (
    <PageContentContainer>
      <DraftProductsPageContent />
    </PageContentContainer>
  );
};

export default DraftProductsContentContainer;
