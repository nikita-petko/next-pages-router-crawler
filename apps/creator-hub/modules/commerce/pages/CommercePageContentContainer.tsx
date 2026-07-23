import React, { FunctionComponent } from 'react';
import PageContentContainer from './PageContentContainer';
import CommercePageContent from './CommercePageContent';

const CommercePageContentContainer: FunctionComponent = () => {
  return (
    <PageContentContainer>
      <CommercePageContent />
    </PageContentContainer>
  );
};

export default CommercePageContentContainer;
