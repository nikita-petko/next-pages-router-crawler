import { makeStyles } from '@rbx/ui';

const useExperienceUrlInputStyles = makeStyles()(() => ({
  textField: {
    width: '100%',
    marginTop: '1px', // NOTE(shumingxu, 10/10/2023): webblox textfield has height 40px but button has 42px
  },
}));

export default useExperienceUrlInputStyles;
