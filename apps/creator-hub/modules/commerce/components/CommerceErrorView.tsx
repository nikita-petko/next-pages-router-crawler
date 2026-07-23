import React, { FunctionComponent } from 'react';
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import FailureView, {
  FailureViewProp as FailureViewProps,
} from '@modules/miscellaneous/common/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CommerceEmptyContainer from './CommerceEmptyContainer';

export type CommerceErrorViewProps = Partial<FailureViewProps>;

const CommerceErrorView: FunctionComponent<CommerceErrorViewProps> = (props) => {
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
