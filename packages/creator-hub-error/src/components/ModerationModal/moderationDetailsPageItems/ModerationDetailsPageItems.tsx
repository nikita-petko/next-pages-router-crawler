import React from 'react';
import type {
  HttpControllerGetNotApprovedResponseBadUtterance,
  HttpControllerGetNotApprovedResponseViolation,
} from '@rbx/client-behavior-intervention/v1';
import { Grid } from '@rbx/ui';
import AppealsProcessPageItem from './pageItems/AppealsProcessPageItem';
import BadUtterancesPageItem from './pageItems/BadUtterancesPageItem';
import CommunityStandardsAndAppealsPageItem from './pageItems/CommunityStandardsAndAppealsPageItem';
import ConsequenceTransparencyPageItem from './pageItems/ConsequenceTransparencyPageItem';
import DeleteDescriptionPageItem from './pageItems/DeleteDescriptionPageItem';
import ForeshadowPageItem from './pageItems/ForeshadowPageItem';
import ModeratorNotePageItem from './pageItems/ModeratorNotePageItem';
import ReactivationDatePageItem from './pageItems/ReactivationDatePageItem';
import StartDatePageItem from './pageItems/StartDatePageItem';
import TermsOfUsePageItem from './pageItems/TermsOfUsePageItem';
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
