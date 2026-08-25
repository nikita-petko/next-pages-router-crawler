import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import type { FailureViewProps } from '@modules/miscellaneous/components/FailureView/FailureView';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CommerceEmptyContainer from './CommerceEmptyContainer';

type CommerceErrorViewProps = Partial<FailureViewProps>;

const CommerceErrorView = (props: CommerceErrorViewProps) => {
  const router = useRouter();
  const { translate } = useTranslation();

  return (
    <CommerceEmptyContainer>
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={() => router.reload()}
        {...props}
      />
    </CommerceEmptyContainer>
  );
};

export default withTranslation(CommerceErrorView, [TranslationNamespace.Error]);
