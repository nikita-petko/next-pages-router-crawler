import type { FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';
import { StatusCodes } from '@rbx/core';
import type { GetQuestionnaireStatusForUserResponse } from '@modules/clients/experienceQuestionnaire';
import experienceQuestionnaireClient from '@modules/clients/experienceQuestionnaire';
import { PageLoading } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import networkRequestManager from '@modules/questionnaire/implementations/QuestionnaireNetworkRequestManager';
import ExperienceQuestionnaireContainer from './ExperienceQuestionnaireContainer';

const ExperienceQuestionnaireMetadataContainer: FunctionComponent<React.PropsWithChildren> = () => {
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
