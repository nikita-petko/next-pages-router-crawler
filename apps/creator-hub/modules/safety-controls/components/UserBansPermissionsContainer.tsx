import { useRouter } from 'next/router';
import type { FunctionComponent, PropsWithChildren } from 'react';
import { StatusCodes } from '@rbx/core';
import Authenticated from '@modules/authentication/Authenticated';
import { PageLoading } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { useUniversePermissions } from '@modules/react-query/organizations/organizationsQueries';
import { getExperienceIdFromQueryParams } from '../utils/userBansDataUtils';

const UserBansPermissionsContainer: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  /* Parse out universe ID. */
  let universeId: number | undefined;
  try {
    universeId = getExperienceIdFromQueryParams(router.query.id);
  } catch {
    universeId = undefined;
  }
  const { data, isLoading, isError, refetch } = useUniversePermissions(universeId);

  if (isLoading) {
    return <PageLoading />;
  }

  if (isError) {
    return <LoadError onReload={refetch} />;
  }

  if (!data?.manageBans) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return <Authenticated>{children}</Authenticated>;
};

export default UserBansPermissionsContainer;
