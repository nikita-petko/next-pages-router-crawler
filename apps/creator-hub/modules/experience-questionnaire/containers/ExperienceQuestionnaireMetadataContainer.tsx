import React, { FunctionComponent, useEffect, useState } from 'react';
import { ErrorPage } from '@modules/miscellaneous/error';
import { PageLoading } from '@modules/miscellaneous/common';
import networkRequestManager from '@modules/questionnaire/implementations/QuestionnaireNetworkRequestManager';
import { StatusCodes } from '@rbx/core';
import experienceQuestionnaireClient, {
  GetQuestionnaireStatusForUserResponse,
} from '@modules/clients/experienceQuestionnaire';
import ExperienceQuestionnaireContainer from './ExperienceQuestionnaireContainer';

const ExperienceQuestionnaireMetadataContainer: FunctionComponent<
  React.PropsWithChildren<unknown>
> = () => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getIsEnabled = async () => {
    try {
      const response: GetQuestionnaireStatusForUserResponse =
        await networkRequestManager.attemptNetworkRequestWithRetry<GetQuestionnaireStatusForUserResponse>(
          () => experienceQuestionnaireClient.getQuestionnaireStatus(),
        );
      if (response.isEnabled) {
        setIsEnabled(true);
      }
    } catch {
      // Doesn't matter if there's an error, we don't show this page.
    }

    setIsLoading(false);
  };

  useEffect(() => {
    getIsEnabled();
  }, []);

  if (isLoading) {
    return <PageLoading />;
  }

  if (isEnabled) {
    return <ExperienceQuestionnaireContainer />;
  }

  return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
};

export default ExperienceQuestionnaireMetadataContainer;
