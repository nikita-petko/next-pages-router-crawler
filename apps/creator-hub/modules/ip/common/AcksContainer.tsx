import React from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentAccountContext } from '../components/AccountProvider';
import AckModal from './AckModal';

/**
 *  AcksContainer displays all modals for all pending acknowlegdements.
 */
const AcksContainer = () => {
  // this is just an empty array if the Rights user does not exist
  const { pendingAcks } = useCurrentAccountContext();

  return (
    <>
      {pendingAcks?.map((ack) => {
        return <AckModal key={ack.id} ack={ack} />;
      })}
    </>
  );
};

export default withTranslation(AcksContainer, [TranslationNamespace.RightsPortal]);
