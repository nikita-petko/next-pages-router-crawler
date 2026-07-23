import type { FunctionComponent } from 'react';
import { useCallback, useState } from 'react';
import { TaxbitCuringDocumentation as TaxbitCuringDocumentationSdk } from '@taxbit/react-sdk';
import { useLocalization } from '@rbx/intl';
import TaxesLoading from '../../taxes/components/TaxesLoading';
import { getTaxbitLocale, TaxbitLoadingSentinel } from './TaxbitTaxSubmissionQuestionnaire';
import styles from './TaxbitTaxSubmissionQuestionnaire.module.css';

export type TaxbitCuringDocumentationProps = {
  bearerToken: string;
  loadingLabel: string;
  onError: (error: Error) => void;
  onReady: () => void;
  onSuccess: () => void;
};

const TaxbitCuringDocumentation: FunctionComponent<TaxbitCuringDocumentationProps> = ({
  bearerToken,
  loadingLabel,
  onError,
  onReady,
  onSuccess,
}) => {
  const { locale } = useLocalization();
  const [isSdkLoading, setIsSdkLoading] = useState(true);

  const handleSdkLoadingComplete = useCallback(() => {
    setIsSdkLoading(false);
    onReady();
  }, [onReady]);

  return (
    <div className={styles.root}>
      {isSdkLoading && <TaxesLoading context='taxbit' label={loadingLabel} />}
      <div className={isSdkLoading ? styles.sdkLoading : undefined}>
        <TaxbitCuringDocumentationSdk
          bearerToken={bearerToken}
          collectSignatureName
          language={getTaxbitLocale(locale)}
          loadingComponent={<TaxbitLoadingSentinel onLoadingComplete={handleSdkLoadingComplete} />}
          onError={onError}
          onSuccess={onSuccess}
        />
      </div>
    </div>
  );
};

export default TaxbitCuringDocumentation;
