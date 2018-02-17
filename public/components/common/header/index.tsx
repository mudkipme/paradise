import ExitIcon from "material-ui-icons/ExitToApp";
import MenuIcon from "material-ui-icons/Menu";
import AppBar from "material-ui/AppBar";
import Divider from "material-ui/Divider";
import Drawer from "material-ui/Drawer";
import Grid from "material-ui/Grid";
import IconButton from "material-ui/IconButton";
import List, { ListItem, ListItemIcon, ListItemText } from "material-ui/List";
import { withStyles, WithStyles } from "material-ui/styles";
import Toolbar from "material-ui/Toolbar";
import Typography from "material-ui/Typography";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { compose } from "recompose";
import { IAppState } from "../../../reducers";

interface IStateProps {
    hasLogin: boolean;
    displayName: string;
}

const styles = {
    drawerPaper: {
        width: "15rem",
    },
    menuButton: {
        marginRight: "1.25rem",
    },
    root: {
        marginBottom: "1.875rem",
    },
    title: {
        flex: 1,
    },
};

class Header extends React.Component<IStateProps & WithStyles<keyof typeof styles>> {
    public state = {
        open: false,
    };

    public render() {
        const { classes, hasLogin, displayName } = this.props;
        const { open } = this.state;
        return (
            <Grid container>
                <AppBar position="static" className={classes.root}>
                    <Toolbar>
                        <IconButton color="inherit" onClick={this.handleDrawerOpen} className={classes.menuButton}>
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="title" color="inherit" className={classes.title}>
                            Rakuen
                        </Typography>
                    </Toolbar>
                </AppBar>
                <Drawer open={open} onClose={this.handleDrawerClose} classes={{ paper: classes.drawerPaper }}>
                    <div>
                        <List component="nav">
                            <ListItem
                                button
                                component={(props) => <Link {...props} to="/" />}
                                onClick={this.handleDrawerClose}>
                                <ListItemText primary="Home" />
                            </ListItem>
                        </List>
                        <Divider />
                        {hasLogin ? (
                            <List component="nav">
                                <ListItem
                                    button
                                    component={(props) => <Link {...props} to="/profile" />}
                                    onClick={this.handleDrawerClose}>
                                    <ListItemText primary={displayName} />
                                </ListItem>
                                <ListItem
                                    button
                                    component={(props) => <Link {...props} to="/auth/logout" />}
                                    onClick={this.handleDrawerClose}>
                                    <ListItemIcon>
                                        <ExitIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Logout" />
                                </ListItem>
                            </List>
                        ) : (
                            <div />
                        )}
                    </div>
                </Drawer>
            </Grid>
        );
    }

    private handleDrawerOpen = () => {
        this.setState({ open: true });
    }

    private handleDrawerClose = () => {
        this.setState({ open: false });
    }
}

const mapStateToProps: (state: IAppState) => IStateProps = (state: IAppState) => ({
    displayName: state.profile.displayName,
    hasLogin: state.profile.hasLogin,
});

export default compose<IStateProps & WithStyles<keyof typeof styles>, {}>(
    withStyles(styles),
    connect(mapStateToProps),
)(Header);
