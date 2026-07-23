import type { FunctionComponent } from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import TextToSpeechAnalyticsContainer from '../components/TextToSpeechAnalyticsContainer';

const TextToSpeechPage: FunctionComponent = () => {
  return <TextToSpeechAnalyticsContainer />;
};

export default withTranslation(TextToSpeechPage, [TranslationNamespace.CloudServices]);
