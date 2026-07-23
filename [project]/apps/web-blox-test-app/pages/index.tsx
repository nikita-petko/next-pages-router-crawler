import MaintenancePage from "@modules/components/pages/MaintenancePage";
import TestAppMetaLayout from "@modules/components/layouts/TestAppMetaLayout";

const Home = () => <MaintenancePage />;

Home.getPageLayout = (page: React.ReactNode) => {
  return (
    <TestAppMetaLayout title="Maintenance" description="Maintenance Test page">
      {page}
    </TestAppMetaLayout>
  )
};

export default Home;
