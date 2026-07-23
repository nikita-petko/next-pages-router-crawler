import { makeStyles } from '@rbx/ui';

const useCreatorDisputeModalStyles = makeStyles()(() => ({
  error: {
    paddingLeft: '16px',
  },
  option: {
    padding: '16px',
  },
  title: {
    paddingLeft: '12px',
    paddingRight: '12px',
    paddingTop: '12px',
  },
  stepper: {
    paddingLeft: '4px',
    paddingRight: '4px',
    paddingTop: '12px',
  },
  stepContent: {
    paddingBottom: '8px',
    paddingLeft: '20px',
    paddingRight: '12px',
    paddingTop: '20px',
  },
}));

export default useCreatorDisputeModalStyles;
