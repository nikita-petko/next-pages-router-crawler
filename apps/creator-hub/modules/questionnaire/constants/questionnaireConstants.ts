import { getProductionCreatorHubUrl } from '@rbx/env-utils';

export const QUESTIONS_COUNT = 25;
export const TOAST_AUTO_HIDE_DURATION_MILLISECONDS = 5000;
export const RADIO_BUTTON_QUESTION_TYPE = 'RadioButtonQuestion';
export const CHECKBOX_QUESTION_TYPE = 'CheckBoxQuestion';
export const TEXTBOX_QUESTION_TYPE = 'TextBoxQuestion';
export const QUESTIONNAIRE_FIRST_STEP = 0;
export const QUESTIONNAIRE_TRANSLATION_KEYS = {
  MISSING_QUESTIONNAIRE_ID_TITLE: 'Title.MissingQuestionnaireId',
  MISSING_QUESTIONNAIRE_ID_MESSAGE: 'Message.MissingQuestionnaireId',
  CHANGED_QUESTIONNAIRE_ID_TITLE: 'Title.ChangedQuestionnaireId',
  CHANGED_QUESTIONNAIRE_ID_MESSAGE: 'Message.ChangedQuestionnaireId',
  MISSING_DESCRIPTOR_TITLE: 'Title.MissingDescriptor',
  MISSING_DESCRIPTOR_MESSAGE: 'Message.MissingDescriptor',
  STARTED: {
    titleKey: 'Title.InProgress',
    messageKey: 'Message.InProgress',
    buttonKey: 'Button.Resume',
  },
  NOT_STARTED: {
    titleKey: 'Title.NotStarted',
    messageKey: 'Message.NotStarted',
    buttonKey: 'Button.Start',
  },
  SUBMITTED: {
    titleKey: 'Title.QuestionnaireSubmitted',
    messageKey: 'Message.QuestionnaireSubmitted',
    buttonKey: 'Button.RetryQuestionnaire',
  },
};

export const GUIDELINES_TRANSLATION_KEYS = {
  STARTED: {
    titleKey: 'Title.GuidelinesInProgress',
    messageKey: 'Message.GuidelinesInProgress',
    buttonKey: 'Button.Resume',
  },
  NOT_STARTED: {
    titleKey: 'Title.GuidelinesNotStarted',
    messageKey: 'Message.GuidelinesNotStarted',
    buttonKey: 'Button.Start',
  },
  SUBMITTED_OLD_VERSION: {
    titleKey: 'Title.GuidelinesSubmittedOldVersion',
    messageKey: 'Message.GuidelinesSubmittedOldVersion',
    buttonKey: 'Button.Update',
  },
  SUBMITTED_NEW_VERSION: {
    titleKey: 'Title.GuidelinesSubmittedNewVersion',
    messageKey: 'Message.GuidelinesSubmittedNewVersion',
    buttonKey: 'Button.Restart',
  },
  SUBMITTED_NEW_VERSION_STARTED: {
    titleKey: 'Title.GuidelinesSubmittedNewVersionInProgress',
    messageKey: 'Message.GuidelinesSubmittedNewVersionInProgress',
    buttonKey: 'Button.Resume',
  },
  SUBMITTED_REJECTED: {
    titleKey: 'Title.GuidelinesSubmittedModeratorRejected',
    messageKey: '',
    buttonKey: 'Button.Restart',
  },
};

export const CONTENT_MATURITY_TRANSLATION_KEYS = {
  STARTED: {
    titleKey: 'Title.GuidelinesInProgress',
    messageKey: 'Message.ContentMaturityInProgress',
    buttonKey: 'Button.Resume',
  },
  NOT_STARTED: {
    titleKey: 'Title.GuidelinesNotStarted',
    messageKey: 'Message.ContentMaturityNotStarted',
    buttonKey: 'Button.Start',
  },
  SUBMITTED_OLD_VERSION: {
    titleKey: 'Title.GuidelinesSubmittedOldVersion',
    messageKey: 'Message.ContentMaturitySubmittedOldVersion',
    buttonKey: 'Button.Update',
  },
  SUBMITTED_NEW_VERSION: {
    titleKey: 'Title.GuidelinesSubmittedNewVersion',
    messageKey: 'Message.ContentMaturitySubmittedNewVersion',
    buttonKey: 'Button.Restart',
  },
  SUBMITTED_NEW_VERSION_STARTED: {
    titleKey: 'Title.GuidelinesSubmittedNewVersionInProgress',
    messageKey: 'Message.ContentMaturitySubmittedNewVersionInProgress',
    buttonKey: 'Button.Resume',
  },
  SUBMITTED_REJECTED: {
    titleKey: 'Title.GuidelinesSubmittedModeratorRejected',
    messageKey: '',
    buttonKey: 'Button.Restart',
  },
};

export const PROGRESS_STATES = {
  SUBMITTED: 'submitted',
  STARTED: 'started',
  NOT_STARTED: 'not_started',
};
export const POLICY_API_LINKS = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/reference/engine/classes/PolicyService`;

export const EXPERIENCE_GUIDELINES_LINKS = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/promotion/experience-guidelines`;

export const UNITED_KINGDOM_COUNTRY_CODE = 'GB';
