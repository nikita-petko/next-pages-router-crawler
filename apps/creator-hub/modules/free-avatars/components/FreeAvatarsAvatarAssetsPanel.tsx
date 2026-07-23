import FreeAvatarsSection from './FreeAvatarsSection';

function FreeAvatarsAvatarAssetsPanel({ universeId }: { universeId: number }) {
  return (
    <div className='min-width-0 no-clip width-full'>
      <FreeAvatarsSection universeId={universeId} />
    </div>
  );
}

export default FreeAvatarsAvatarAssetsPanel;
