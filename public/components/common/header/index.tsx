import MenuIcon from "material-ui-icons/Menu";
import AppBar from "material-ui/AppBar";
import Drawer from "material-ui/Drawer";
import Grid from "material-ui/Grid";
import IconButton from "material-ui/IconButton";
import List, { ListItem, ListItemText } from "material-ui/List";
import { withStyles, WithStyles } from "material-ui/styles";
import Toolbar from "material-ui/Toolbar";
import Typography from "material-ui/Typography";
import React from "react";
import { Link } from "react-router-dom";

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

class Header extends React.Component<{} & WithStyles<keyof typeof styles>> {
    public state = {
        open: false,
    };

    public render() {
        const { classes } = this.props;
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
                        <List>
                            <ListItem
                                button
                                component={(props) => <Link {...props} to="/" />}
                                onClick={this.handleDrawerClose}>
                                <ListItemText primary="Home" />
                            </ListItem>
                        </List>
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

export default withStyles(styles)<{}>(Header);
