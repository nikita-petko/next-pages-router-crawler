import React from 'react';
import { Grid } from '@rbx/ui';
import {
  HttpControllerGetNotApprovedResponseBadUtterance,
  HttpControllerGetNotApprovedResponseViolation,
} from '@rbx/client-behavior-intervention/v1';
import AppealsProcessPageItem from './pageItems/AppealsProcessPageItem';
import ForeshadowPageItem from './pageItems/ForeshadowPageItem';
import TermsOfUsePageItem from './pageItems/TermsOfUsePageItem';
import StartDatePageItem from './pageItems/StartDatePageItem';
import ReactivationDatePageItem from './pageItems/ReactivationDatePageItem';
import ModeratorNotePageItem from './pageItems/ModeratorNotePageItem';
import ConsequenceTransparencyPageItem from './pageItems/ConsequenceTransparencyPageItem';
import CommunityStandardsAndAppealsPageItem from './pageItems/CommunityStandardsAndAppealsPageItem';
import DeleteDescriptionPageItem from './pageItems/DeleteDescriptionPageItem';
import BadUtterancesPageItem from './pageItems/BadUtterancesPageItem';
import ViolationPageItem from './pageItems/ViolationPageItem';

type TPunishmentData = {
  badUtterances?: Array<HttpControllerGetNotApprovedResponseBadUtterance>;
  beginDate?: Date;
  consequenceTransparencyMessage?: string;
  context?: {
    [key: string]: object;
  };
  endDate?: Date;
  isForeshadowingConsequenceEnabled?: boolean;
  messageToUser?: string;
  punishmentTypeDescription?: string;
  showAppealsProcessLink?: boolean;
  violation?: HttpControllerGetNotApprovedResponseViolation;
};

const ModerationDetailsPageItems: React.FC<TPunishmentData> = ({
  badUtterances,
  beginDate,
  consequenceTransparencyMessage,
  context,
  endDate,
  isForeshadowingConsequenceEnabled,
  messageToUser,
  punishmentTypeDescription,
  showAppealsProcessLink,
  violation,
}) => {
  return (
    <Grid container direction='column' rowGap='24px' paddingBottom='24px'>
      <ForeshadowPageItem
        context={context}
        isForeshadowingConsequenceEnabled={isForeshadowingConsequenceEnabled}
      />
      <TermsOfUsePageItem />
      <StartDatePageItem violation={violation} beginDate={beginDate} />
      <ReactivationDatePageItem
        endDate={endDate}
        punishmentTypeDescription={punishmentTypeDescription}
      />
      <ModeratorNotePageItem messageToUser={messageToUser} />
      <ConsequenceTransparencyPageItem
        consequenceTransparencyMessage={consequenceTransparencyMessage}
      />
      <BadUtterancesPageItem badUtterances={badUtterances} violation={violation} />
      <ViolationPageItem violation={violation} beginDate={beginDate} />
      <CommunityStandardsAndAppealsPageItem />
      <DeleteDescriptionPageItem punishmentTypeDescription={punishmentTypeDescription} />
      <AppealsProcessPageItem showAppealsProcessLink={showAppealsProcessLink} />
    </Grid>
  );
};

export default ModerationDetailsPageItems;
