import { useState } from "react";
import { useRouter } from "next/router";

import TestAppMetaLayout from "@modules/components/layouts/TestAppMetaLayout";
import { Divider, Grid, Typography, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField } from "@rbx/ui";

interface TTestDialogProps {
  title: string;
  content: string;

  open: boolean;
  handleClose: () => void;
}

const TestDialog: React.FC<TTestDialogProps> = ({ title, content, open, handleClose }) => 
(<Dialog maxWidth='sm' open={open} onClose={handleClose}>
  <DialogTitle id=''>{title}</DialogTitle>
  <DialogContent dividers>
    <DialogContentText>{content}</DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button variant='outlined' color='secondary' onClick={handleClose}>
      Cancel
    </Button>
    <Button variant='contained' onClick={handleClose}>
      Confirm
    </Button>
  </DialogActions>
</Dialog>);

const TestPage = () => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const { query: { testQuery = 'test' } } = useRouter();

  return (
    <Grid container direction='column' alignItems='center' justifyContent='center' minHeight='100vh'>
      <Grid container item direction='column' alignItems='center' justifyContent="center" width='fit-content'>
        <Typography variant="h1" align='center' mb={1}>
          Web Blox Test App
        </Typography>
        <Divider sx={{ alignSelf: 'stretch' }} />
        <Typography variant="body1" align='center' mt={2} mb={2}>
          Test Query: {testQuery}
        </Typography>
        <Divider sx={{ alignSelf: 'stretch' }} />

        <TextField id="test-id" label="Test Dialog Content" sx={{ mt: 3 }} onChange={(e) => setText(e.target.value)}/>

        {/* I might change this to a dialog popup or a snackbar */}
        <Button variant='contained' onClick={handleClickOpen} sx={{ mt: 2 }}>Test Button</Button>
        <TestDialog title="Test Dialog" content={text} open={open} handleClose={handleClose}  />
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
