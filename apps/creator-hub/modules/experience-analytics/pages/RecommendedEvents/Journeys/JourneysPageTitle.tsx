import { useRouter } from 'next/router';

function JourneysPageTitle() {
  const { query, isReady } = useRouter();
  if (!isReady) {
    return null;
  }
  const journeyName = typeof query.filter_JourneyName === 'string' ? query.filter_JourneyName : '';
  return <h1 className='text-heading-large margin-none'>{journeyName}</h1>;
}

export default JourneysPageTitle;
