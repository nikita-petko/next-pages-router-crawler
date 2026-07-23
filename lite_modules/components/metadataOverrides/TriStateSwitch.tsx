import { makeStyles } from '@rbx/ui';

export type TriStateValue = 'auto' | 'off' | 'on';

interface TriStateSwitchProps {
  onChange: (value: TriStateValue) => void;
  value: TriStateValue;
}

const useTriStateSwitchStyles = makeStyles()((theme) => ({
  button: {
    backgroundColor: theme.palette.background.default,
    border: '1px solid',
    borderColor: theme.palette.components.divider,
    borderRadius: theme.border.radius.small.borderRadius,
    color: theme.palette.text.secondary,
    cursor: 'pointer',
    flex: 1,
    font: 'inherit',
    fontSize: '11px',
    padding: '4px 0',
  },
  buttonActive: {
    backgroundColor: theme.palette.action.selected,
    borderColor: theme.palette.primary.main,
    color: theme.palette.text.primary,
    fontWeight: 600,
  },
  container: {
    display: 'flex',
    gap: '4px',
    minWidth: '120px',
  },
}));

const TriStateSwitch = ({ onChange, value }: TriStateSwitchProps) => {
  const {
    classes: { button, buttonActive, container },
  } = useTriStateSwitchStyles();

  const options: { label: string; triState: TriStateValue }[] = [
    { label: 'Off', triState: 'off' },
    { label: 'Auto', triState: 'auto' },
    { label: 'On', triState: 'on' },
  ];

  return (
    <div className={container} role='group'>
      {options.map(({ label, triState }) => (
        <button
          className={`${button} ${value === triState ? buttonActive : ''}`}
          key={triState}
          onClick={() => onChange(triState)}
          type='button'>
          {label}
        </button>
      ))}
    </div>
  );
};

export default TriStateSwitch;
