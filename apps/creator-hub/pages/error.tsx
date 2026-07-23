import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import { ErrorPage } from '@modules/miscellaneous/error';
import type { ErrorCode } from '@modules/miscellaneous/error/constants/errorCodeKeyConstants';

const SUPPORTED_ERROR_CODES = new Set<number>([400, 403]);
const DEFAULT_ERROR_CODE: ErrorCode = 400;

function isSupportedErrorCode(rawCode: number): rawCode is ErrorCode {
  return !Number.isNaN(rawCode) && SUPPORTED_ERROR_CODES.has(rawCode);
}

const getErrorPageLayout = (page: ReactNode) => (
  <CreatorHubLayout disableLeftNavigation>{page}</CreatorHubLayout>
);

const CustomErrorPage: NextLayoutPage = () => {
  const router = useRouter();

  if (!router.isReady) {
    return null;
  }

  const rawCode = Number.parseInt(
    typeof router.query.statusCode === 'string' ? router.query.statusCode : '',
    10,
  );
  const errorCode: ErrorCode = isSupportedErrorCode(rawCode) ? rawCode : DEFAULT_ERROR_CODE;

  return <ErrorPage errorCode={errorCode} />;
};

CustomErrorPage.getPageLayout = getErrorPageLayout;
CustomErrorPage.loggerConfig = { rosId: RosTeams.CreatorHubPlatform };

export default CustomErrorPage;
