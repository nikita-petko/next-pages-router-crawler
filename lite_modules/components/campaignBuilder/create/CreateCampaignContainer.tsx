import Header from '@components/campaignBuilder/common/Header';
import CreateCampaignCalloutBanner from '@components/campaignBuilder/create/CreateCampaignCalloutBanner';
import CreateCampaignForm from '@components/campaignBuilder/create/CreateCampaignForm';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';

const CreateCampaignContainer = () => {
  const { calloutBanners } = useCampaignBuilderStore();

  return (
    <>
      <Header />
      {calloutBanners.map((banner) => (
        <CreateCampaignCalloutBanner
          action={banner.action}
          description={banner.description}
          icon={banner.icon}
          key={banner.title}
          severity={banner.severity}
          title={banner.title}
        />
      ))}
      <CreateCampaignForm />
    </>
  );
};

export default CreateCampaignContainer;
