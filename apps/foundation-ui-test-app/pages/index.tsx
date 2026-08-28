import { useState } from 'react';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import TestAppMetaLayout from '@modules/components/layouts/TestAppMetaLayout';
import {
  Accordion,
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  Alert,
  Button,
  Card,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Divider,
  Icon,
  TextInput,
} from '@rbx/foundation-ui';

interface TTestDialogProps {
  title: string;
  content: string;

  open: boolean;
  handleClose: () => void;
}

const TestDynamicComponent = dynamic(
  // Simulate a network delay for the dynamic import
  () =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(import('@modules/components/TestDynamicComponent'));
      }, 2000);
    }) as Promise<typeof import('@modules/components/TestDynamicComponent')>,
  {
    ssr: false,
    loading: () => (
      <Alert variant='Feedback' severity='Warning' hasCloseAffordance={false}>
        Loading dynamic component...
      </Alert>
    ),
  },
);

const TestDialog: React.FC<TTestDialogProps> = ({
  title,
  content,
  open,
  handleClose,
}) => (
  <Dialog
    size='Small'
    hasCloseAffordance={false}
    isModal
    open={open}
    onOpenChange={handleClose}>
    {/* Dialog content should scale X to the buttons */}
    <DialogContent className='!min-width-0'>
      <DialogBody>
        <div className='flex flex-col gap-small'>
          <DialogTitle className='text-heading-large margin-none'>
            {title}
          </DialogTitle>
          <Divider />
          <span className='text-body-medium content-muted padding-y-xsmall'>
            {content}
          </span>
          <Divider />
        </div>
      </DialogBody>
      <DialogFooter>
        <div className='flex justify-center gap-small margin-x-none'>
          <Button variant='Standard' onClick={handleClose}>
            Cancel
          </Button>
          <Button variant='Emphasis' onClick={handleClose}>
            Confirm
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const TestPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleClickOpen = () => {
    if (text.trim() === '') {
      setError('Please enter some text before opening the dialog.');
      return;
    } else {
      setError('');
    }

    setDialogOpen(true);
  };
  const handleClose = () => {
    setDialogOpen(false);
  };

  const {
    query: {
      testQuery = 'test',
      testDynamicImport: testDynamicImportV,
      testDynamicComponent: testDynamicComponentV,
    },
  } = useRouter();

  const testDynamicImport = testDynamicImportV === 'true';
  const testDynamicComponent = testDynamicComponentV === 'true';

  if (testDynamicImport) {
    import('@modules/TestDynamicImport').then((module) => {
      module.default();
    });
  }

  return (
    <div className='flex flex-col items-center justify-center min-height-screen'>
      <div className='flex flex-col items-center justify-center width-fit'>
        <Card
          title='Foundation Test App'
          variant='Emphasis'
          leading={<Icon name='icon-filled-studio' />}>
          {testDynamicComponent && (
            <div className='margin-bottom-small'>
              <TestDynamicComponent />
            </div>
          )}

          <Accordion size='Small' hasDivider>
            <AccordionItem defaultOpen>
              <AccordionItemTrigger>
                <span className='text-label-large content-system-warning'>
                  Important Information
                </span>
              </AccordionItemTrigger>
              <AccordionItemContent>
                <span className='text-body-large'>
                  Set the following query parameters for testing:
                  <ul className='margin-top-xsmall'>
                    <li>
                      <code className='content-system-neutral'>testQuery</code>:
                      Set a value to display in the accordion content.
                    </li>
                    <li>
                      <code className='content-system-neutral'>
                        testDynamicImport
                      </code>
                      : Set to{' '}
                      <code className='content-system-emphasis'>true</code> to
                      test dynamic import.
                    </li>
                    <li>
                      <code className='content-system-neutral'>
                        testDynamicComponent
                      </code>
                      : Set to{' '}
                      <code className='content-system-emphasis'>true</code> to
                      test dynamic component.
                    </li>
                  </ul>
                </span>
              </AccordionItemContent>
            </AccordionItem>

            <AccordionItem>
              <AccordionItemTrigger className='text-label-medium'>
                Test Query
              </AccordionItemTrigger>
              <AccordionItemContent>
                <span className='text-body-large margin-y-small text-align-center'>
                  {testQuery}
                </span>
              </AccordionItemContent>
            </AccordionItem>
          </Accordion>

          <TextInput
            id='test-id'
            label='Test Dialog Content'
            className='margin-top-small'
            variant='Standard'
            hasError={!!error}
            error={error}
            onChange={(e) => setText(e.target.value)}
          />

          <Button
            variant='Emphasis'
            onClick={handleClickOpen}
            className='margin-top-small'>
            Test Button
          </Button>
          <TestDialog
            title='Test Dialog'
            content={text}
            open={dialogOpen}
            handleClose={handleClose}
          />
        </Card>
      </div>
    </div>
  );
};

TestPage.getPageLayout = (page: React.ReactNode) => {
  return (
    <TestAppMetaLayout
      title='Test Page'
      description='Test Page for Foundation UI'>
      {page}
    </TestAppMetaLayout>
  );
};

export default TestPage;
