// https://stackoverflow.com/a/42089476
export default function createNewEvent(eventName: string) {
  let event;
  if (typeof Event === 'function') {
    event = new Event(eventName);
  } else {
    // IE fallback
    event = document.createEvent('Event');
    event.initEvent(eventName, true, true);
  }
  return event;
}
