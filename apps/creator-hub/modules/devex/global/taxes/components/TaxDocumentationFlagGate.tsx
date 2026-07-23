import type { FC, PropsWithChildren } from 'react';
import PageNotFound from '@modules/miscellaneous/error/components/PageNotFound';
import { useTaxDocumentationAccess } from '../hooks/useTaxDocumentationAccess';
import TaxesLoading from './TaxesLoading';

const TaxDocumentationFlagGate: FC<PropsWithChildren> = ({ children }) => {
  const { canAccessTaxDocumentation, isLoading } = useTaxDocumentationAccess();

  if (isLoading) {
    return <TaxesLoading />;
  }

  if (!canAccessTaxDocumentation) {
    return <PageNotFound />;
  }

  return <>{children}</>;
};

export default TaxDocumentationFlagGate;
