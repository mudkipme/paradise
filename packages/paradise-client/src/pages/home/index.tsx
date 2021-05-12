import { FC } from 'react';
import { css } from '@emotion/react';
import { Typography } from '@material-ui/core';

const Home: FC = () => (
  <Typography
    css={css`
      display: flex;
      align-items: center;
      height: 15rem;
      justify-content: center;
    `}
  >
    Welcome to Paradise.
  </Typography>
);

export default Home;
