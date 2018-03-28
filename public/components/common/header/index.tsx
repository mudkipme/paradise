import { gql } from "apollo-boost";
import ExitIcon from "material-ui-icons/ExitToApp";
import MenuIcon from "material-ui-icons/Menu";
import AppBar from "material-ui/AppBar";
import Divider from "material-ui/Divider";
import Drawer from "material-ui/Drawer";
import Grid from "material-ui/Grid";
import IconButton from "material-ui/IconButton";
import List, { ListItem, ListItemIcon, ListItemText } from "material-ui/List";
import { withStyles, WithStyles } from "material-ui/styles";
import SvgIcon from "material-ui/SvgIcon";
import Toolbar from "material-ui/Toolbar";
import Typography from "material-ui/Typography";
import React, { PureComponent } from "react";
import { ChildDataProps, graphql } from "react-apollo";
import { Link } from "react-router-dom";
import { compose } from "recompose";
import { HeaderQuery } from "../../../interfaces/operation-result-types";
import query from "../../../queries/header.graphql";

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

class Header extends PureComponent<ChildDataProps<{}, HeaderQuery, {}> & WithStyles<keyof typeof styles>> {
    public state = {
        open: false,
    };

    public render() {
        const { classes, data } = this.props;
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
                        {data.currentTrainer ? (
                            <List component="nav">
                                <ListItem
                                    button
                                    component={(props) => <Link {...props} to="/profile" />}
                                    onClick={this.handleDrawerClose}>
                                    <ListItemText primary={data.currentTrainer.name} />
                                </ListItem>
                                <ListItem button component="a" href="/auth/logout">
                                    <ListItemIcon>
                                        <ExitIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Logout" />
                                </ListItem>
                            </List>
                        ) : this.renderLogin()}
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

    private renderLogin = () => (
        <List component="nav">
            {this.props.data.config && this.props.data.config.loginStrategies.map((strategy) => {
                switch (strategy) {
                    case "github":
                        return this.renderLoginGithub();
                    default:
                        return null;
                }
            })}
        </List>
    )

    private renderLoginGithub() {
        return (
            <ListItem key="github" button component="a" href="/auth/github">
                <ListItemIcon>
                    <SvgIcon>
                        {/* tslint:disable-next-line:max-line-length */}
                        <path d="M12.007 0C6.12 0 1.1 4.27.157 10.08c-.944 5.813 2.468 11.45 8.054 13.312.19.064.397.033.555-.084.16-.117.25-.304.244-.5v-2.042c-3.33.735-4.037-1.56-4.037-1.56-.22-.726-.694-1.35-1.334-1.756-1.096-.75.074-.735.074-.735.773.103 1.454.557 1.846 1.23.694 1.21 2.23 1.638 3.45.96.056-.61.327-1.178.766-1.605-2.67-.3-5.462-1.335-5.462-6.002-.02-1.193.42-2.35 1.23-3.226-.327-1.015-.27-2.116.166-3.09 0 0 1.006-.33 3.3 1.23 1.966-.538 4.04-.538 6.003 0 2.295-1.5 3.3-1.23 3.3-1.23.445 1.006.49 2.144.12 3.18.81.877 1.25 2.033 1.23 3.226 0 4.607-2.805 5.627-5.476 5.927.578.583.88 1.386.825 2.206v3.29c-.005.2.092.393.26.507.164.115.377.14.565.063 5.568-1.88 8.956-7.514 8.007-13.313C22.892 4.267 17.884.007 12.008 0z" />
                    </SvgIcon>
                </ListItemIcon>
                <ListItemText primary="Login with GitHub" />
            </ListItem>
        );
    }
}

export default compose<ChildDataProps<{}, HeaderQuery, {}> & WithStyles<keyof typeof styles>, {}>(
    withStyles(styles),
    graphql(query),
)(Header);
