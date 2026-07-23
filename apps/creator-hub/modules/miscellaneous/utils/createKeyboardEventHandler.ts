import type { SyntheticEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';

function isKeyboardEvent(event: Event | SyntheticEvent): boolean {
  if (event instanceof Event) {
    return event instanceof KeyboardEvent;
  }
  return event.nativeEvent && event.nativeEvent instanceof KeyboardEvent;
}

function keyboardPredicate(event: Event | SyntheticEvent): boolean {
  const keys = [/** for IE 11 */ 'Spacebar', ' ', 'Enter'];

  if (!isKeyboardEvent(event)) {
    // eslint-disable-next-line no-console -- diagnostic warning for developers about incorrect handler usage
    console.info(
      'The event passed in is not a keyboard event, are you using the handler in the wrong place?',
    );
    return false;
  }
  return keys.includes((event as KeyboardEvent | ReactKeyboardEvent).key);
}

/**
 * Generic utility factory method for creating event handler
 * @param fn the callback function to be executed if the condition is met
 */
export default function createEventHandler(
  fn: () => void,
): (event: Event | SyntheticEvent) => void {
  return (event: Event | SyntheticEvent): void => {
    if (keyboardPredicate(event)) {
      event.preventDefault();
      fn();
    }
  };
}
