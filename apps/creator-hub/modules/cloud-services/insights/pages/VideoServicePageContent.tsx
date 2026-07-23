import type { FunctionComponent } from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import VideoServiceAnalyticsContainer from '../components/VideoServiceAnalyticsContainer';

const VideoServicePage: FunctionComponent = () => {
  return <VideoServiceAnalyticsContainer />;
};

export default withTranslation(VideoServicePage, [TranslationNamespace.CloudServices]);
