import applicationAuthorizationClient from '@modules/clients/applicationAuthorization';
import { ApplicationAuthorizationsApiModelsResponseApplicationManagementMetadataResponse as OAuthMetadataResponse } from '@rbx/clients/applicationAuthorizationsApi';
import React, {
  createContext,
  FunctionComponent,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type TOAuthMetadataContext = {
  metadataResponse: OAuthMetadataResponse;
  isLoading: boolean;
  hasError: boolean;
};

const defaultMetadata = {
  isCreateUserApplicationsAllowed: false,
  isViewUserApplicationsAllowed: false,
  isUpdateUserApplicationsAllowed: false,
  isDeleteUserApplicationsAllowed: false,
  minNameLength: 0,
  maxNameLength: 0,
  maxSummaryLength: 0,
  maxRedirectUriCount: 0,
  maxRedirectUriLength: 0,
  maxActiveApplications: 0,
  actions: [],
};

const defaultOAuthContext = {
  metadataResponse: defaultMetadata,
  isLoading: false,
  hasError: false,
  actions: [],
};

export const OAuthMetadataContext = createContext<TOAuthMetadataContext>(defaultOAuthContext);

export const OAuthMetadataProvider: FunctionComponent<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const [OAuthMetadata, setOAuthMetadata] = useState<OAuthMetadataResponse>(defaultMetadata);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    const fetchOAuthMetadata = async () => {
      setIsLoading(true);
      try {
        const result = await applicationAuthorizationClient.getMetadataInformation();
        setOAuthMetadata(result);
        setHasError(false);
      } catch {
        setHasError(true);
      }
      setIsLoading(false);
    };
    fetchOAuthMetadata();
  }, []);

  const contextValue = useMemo(
    () => ({
      metadataResponse: OAuthMetadata,
      isLoading,
      hasError,
    }),
    [OAuthMetadata, isLoading, hasError],
  );

  return (
    <OAuthMetadataContext.Provider value={contextValue}>{children}</OAuthMetadataContext.Provider>
  );
};

export default function useOAuthMetadata() {
  return useContext(OAuthMetadataContext);
}
