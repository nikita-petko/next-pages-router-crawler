import { useRouter } from 'next/router';
import React from 'react';
import RightsApiErrorView from '../../rights/components/error/RightsApiErrorView';

interface Props {
  error?: unknown;
}

/**
 * Page load error view for Agreements Manager pages
 */
const IpLoadError = ({ error }: Props) => {
  const router = useRouter();
  return (
    <RightsApiErrorView
      errorResponse={error}
      handleReload={() => router.reload()}
      fallbackToGenericError
    />
  );
};

export default IpLoadError;
