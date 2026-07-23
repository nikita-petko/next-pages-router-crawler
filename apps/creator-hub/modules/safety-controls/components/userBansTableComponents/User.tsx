import { Typography } from '@rbx/ui';
import Flex from '@modules/miscellaneous/components/Flex';

type UserProps = {
  userId: number;
  username: string;
};

const User = ({ userId, username }: UserProps) => {
  return (
    <Flex flexDirection='column'>
      <Typography component='subtitle2' variant='subtitle2'>
        {userId}
      </Typography>
      <Typography style={{ textOverflow: 'ellipsis', overflow: 'hidden' }} color='secondary'>
        @{username}
      </Typography>
    </Flex>
  );
};

export default User;
