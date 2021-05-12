import { FC } from 'react';
import { css } from '@emotion/react';
import { Typography } from '@material-ui/core';

const Footer: FC = () => (
  <footer
    css={css`
      display: flex;
      margin-top: 1rem;
      margin-bottom: 1rem;
      justify-content: center;
    `}
  >
    <Typography variant="body1">
      &copy;
      {' '}
      <a
        css={css`
        &:hover {
          text-decoration: underline;
        }
        color: inherit;
        text-decoration: none;
      `}
        href="https://mudkip.me/"
      >
        Mudkip
      </a>
    </Typography>
  </footer>
);

export default Footer;
