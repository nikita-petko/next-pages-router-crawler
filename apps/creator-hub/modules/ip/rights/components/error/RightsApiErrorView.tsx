import React, { FunctionComponent } from 'react';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PageLoading } from '@modules/miscellaneous/common';
import { getResponseFromError } from '@modules/clients/utils';
import ErrorType from '../../enums/ErrorType';
import AuthFailureView from './AuthFailureView';

export function getErrorType(errorResponse: unknown) {
  const err = getResponseFromError(errorResponse);
  if (!err) {
    return ErrorType.None;
  }

  if (!err.status) {
    // didnt receive a error response, usually api gateway issue
    return ErrorType.ServerError;
  }
  if (err.status >= 500) {
    return ErrorType.ServerError;
  }
  if (err.status === 401 || err.status === 403) {
    return ErrorType.AuthError;
  }
  if (err.status === 404) {
    return ErrorType.NotFound;
  }
  if (err.status >= 400) {
    return ErrorType.RequestError;
  }
  return ErrorType.None;
}

export type ErrorContainerProps = {
  errorResponse?: unknown;
  errorType?: ErrorType;
  handleReload?: () => void;
  /**
   * If we can't determine the error type (or none was given),
   * fallback to a generic error view
   */
  fallbackToGenericError?: boolean;
};

const RightsApiErrorView: FunctionComponent<React.PropsWithChildren<ErrorContainerProps>> = ({
  errorResponse,
  errorType,
  handleReload,
  fallbackToGenericError,
}) => {
  const { ready, translate } = useTranslation();
  if (!ready) {
    return <PageLoading />;
  }
  // use errorType by default, but override with errorResponse if given
  const finalErrorType = errorResponse ? getErrorType(errorResponse) : errorType;
  if (finalErrorType === ErrorType.ServerError) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={handleReload}
      />
    );
  }
  if (finalErrorType === ErrorType.AuthError) {
    return <AuthFailureView />;
  }
  if (finalErrorType === ErrorType.NotFound) {
    return (
      <FailureView
        title={translate('Heading.PageNotFound')}
        message={translate('Message.PageNotFound')}
      />
    );
  }
  if (finalErrorType === ErrorType.RequestError) {
    return (
      <FailureView
        title={translate('Heading.BadRequest')}
        message={translate('Message.BadRequest')}
      />
    );
  }

  if (fallbackToGenericError) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={handleReload}
      />
    );
  }

  return null;
};

export default withTranslation(RightsApiErrorView, [TranslationNamespace.Error]);
