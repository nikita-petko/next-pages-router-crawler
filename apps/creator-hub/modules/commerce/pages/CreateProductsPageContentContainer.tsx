import React, { FunctionComponent } from 'react';
import PageContentContainer from './PageContentContainer';
import CreateProductsPageContent from './CreateProductsPageContent';

const CreateProductsContentContainer: FunctionComponent<React.PropsWithChildren> = () => {
  return (
    <PageContentContainer>
      <CreateProductsPageContent />
    </PageContentContainer>
  );
};

export default CreateProductsContentContainer;
