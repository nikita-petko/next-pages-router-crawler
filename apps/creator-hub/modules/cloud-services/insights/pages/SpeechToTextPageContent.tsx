import type { FunctionComponent } from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import SpeechToTextAnalyticsContainer from '../components/SpeechToTextAnalyticsContainer';

const SpeechToTextPage: FunctionComponent = () => {
  return <SpeechToTextAnalyticsContainer />;
};

export default withTranslation(SpeechToTextPage, [TranslationNamespace.CloudServices]);
