import { FC } from 'react';
import { css } from '@emotion/react';
import { Typography } from '@material-ui/core';

const NotFound: FC = () => (
  <Typography
    css={css`
      display: flex;
      align-items: center;
      height: 15rem;
      justify-content: center;
    `}
  >
    The page you’re looking for can’t be found.
  </Typography>
);

export default NotFound;
