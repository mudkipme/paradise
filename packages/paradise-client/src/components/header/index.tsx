import { css } from '@emotion/react';
import {
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Grid,
  Divider,
  ListItemIcon,
} from '@material-ui/core';
import ExitToAppOutlined from '@material-ui/icons/ExitToAppOutlined';
import GitHub from '@material-ui/icons/GitHub';
import MenuOutlined from '@material-ui/icons/MenuOutlined';
import { FC, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useCurrentTrainerQuery } from '../../generated/graphql';

const Header: FC = () => {
  const [open, setOpen] = useState(false);
  const history = useHistory();

  const [currentTrainer] = useCurrentTrainerQuery();

  const navigate = (to: string) => () => {
    setOpen(false);
    history.push(to);
  };

  const logout = async () => {
    await fetch('/auth/logout', {
      method: 'POST',
    });
    window.location.replace('/');
  };

  const renderLogin = () => (
    <List>
      <ListItem button component="a" href="/auth/github">
        <ListItemIcon>
          <GitHub />
        </ListItemIcon>
        <ListItemText primary="Login with GitHub" />
      </ListItem>
    </List>
  );

  const renderUser = () => (
    <List component="nav">
      <ListItem button onClick={() => setOpen(false)}>
        <ListItemText primary={currentTrainer.data?.currentTrainer?.name} />
      </ListItem>
      <ListItem button onClick={logout}>
        <ListItemIcon>
          <ExitToAppOutlined />
        </ListItemIcon>
        <ListItemText primary="Logout" />
      </ListItem>
    </List>
  );

  return (
    <Grid>
      <AppBar>
        <Toolbar>
          <IconButton edge="start" color="inherit" sx={{ mr: 2 }} onClick={() => setOpen(true)}>
            <MenuOutlined />
          </IconButton>
          <Typography variant="h6" color="inherit" sx={{ flexGrow: 1 }}>
            Paradise
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer open={open} onClose={() => setOpen(false)}>
        <div
          css={css`
            min-width: 15rem;
          `}
        >
          <List component="nav">
            <ListItem button onClick={navigate('/')}>
              <ListItemText primary="Home" />
            </ListItem>
          </List>
          <Divider />
          { currentTrainer.data?.currentTrainer ? renderUser() : renderLogin() }
        </div>
      </Drawer>
    </Grid>
  );
};

export default Header;
