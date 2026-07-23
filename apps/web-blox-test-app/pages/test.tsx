import { useRouter } from "next/router";

import TestAppMetaLayout from "@modules/components/layouts/TestAppMetaLayout";
import { Divider, Grid, Typography, Button } from "@rbx/ui";

const TestPage = () => {
  const { query: { testQuery = 'test' }} = useRouter();

  return (
    <Grid container direction='column' alignItems='center' justifyContent='center' minHeight='100vh'>
      <Grid container item direction='column' alignItems='center' justifyContent="center" width='fit-content'>
        <Typography variant="h1" align='center'>
          Web Blox Test App
        </Typography>
        <Divider sx={{ alignSelf: 'stretch' }} size='medium' />
        <Typography variant="body1" align='center'>
          Test Query: {testQuery}
        </Typography>
        

        <Button variant='contained' onClick={() => alert('Hi')} sx={{ mt: 2 }}>Test Button</Button>
      </Grid>
    </Grid>
  )
};

TestPage.getPageLayout = (page: React.ReactNode) => {
  return (
    <TestAppMetaLayout title="Test Page" description="Test Page for Web Blox">
      {page}
    </TestAppMetaLayout>
  )
};

export default TestPage;
