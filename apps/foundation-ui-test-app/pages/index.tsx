import { useState } from "react";

import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import TestAppMetaLayout from "@modules/components/layouts/TestAppMetaLayout";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Divider,
  TextInput,
} from "@rbx/foundation-ui";

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
        resolve(import("@modules/components/TestDynamicComponent"));
      }, 2000);
    }) as Promise<typeof import("@modules/components/TestDynamicComponent")>,
  {
    ssr: false,
    loading: () => (
      <span className="text-body-large text-align-x-center">
        Loading Dynamic Component...
      </span>
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
    size="Small"
    hasCloseAffordance={false}
    isModal
    open={open}
    onOpenChange={handleClose}
  >
    <DialogContent>
      <DialogBody>
        <div className="flex flex-col gap-small">
          <DialogTitle className="text-heading-large margin-none">
            {title}
          </DialogTitle>
          <Divider />
          <span className="text-body-medium content-muted margin-y-small">
            {content}
          </span>
          <Divider />
        </div>
      </DialogBody>
      <DialogFooter>
        <div className="flex justify-center gap-small width-full">
          <Button variant="Standard" onClick={handleClose}>
            Close
          </Button>
          <Button variant="Emphasis" onClick={handleClose}>
            Confirm
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const TestPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [text, setText] = useState("");
  const handleClickOpen = () => {
    setDialogOpen(true);
  };
  const handleClose = () => {
    setDialogOpen(false);
  };

  const {
    query: {
      testQuery = "test",
      testDynamicImport: testDynamicImportV,
      testDynamicComponent: testDynamicComponentV,
    },
  } = useRouter();

  const testDynamicImport = testDynamicImportV === "true";
  const testDynamicComponent = testDynamicComponentV === "true";

  if (testDynamicImport) {
    import("@modules/TestDynamicImport").then((module) => {
      module.default();
    });
  }

  return (
    <>
      {testDynamicComponent && <TestDynamicComponent />}

      <div className="flex flex-col items-center justify-center min-height-[100vh]">
        <div className="flex flex-col items-center justify-center width-fit">
          <span className="text-heading-large font-bold margin-bottom-medium text-align-x-center">
            Foundation Test App
          </span>
          <Divider className="self-stretch" />
          <span className="text-body-large margin-y-small text-align-center">
            Test Query: {testQuery}
          </span>
          <Divider className="self-stretch" />

          <TextInput
            id="test-id"
            label="Test Dialog Content"
            className="margin-top-small"
            variant="Standard"
            onChange={(e) => setText(e.target.value)}
          />

          <Button
            variant="Emphasis"
            onClick={handleClickOpen}
            className="margin-top-small"
          >
            Test Button
          </Button>
          {dialogOpen && (
            <TestDialog
              title="Test Dialog"
              content={text}
              open={dialogOpen}
              handleClose={handleClose}
            />
          )}
        </div>
      </div>
    </>
  );
};

TestPage.getPageLayout = (page: React.ReactNode) => {
  return (
    <TestAppMetaLayout title="Test Page" description="Test Page for Foundation UI">
      {page}
    </TestAppMetaLayout>
  );
};

export default TestPage;
