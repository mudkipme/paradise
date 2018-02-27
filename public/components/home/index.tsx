import { StyleRules, withStyles, WithStyles } from "material-ui/styles";
import Typography from "material-ui/Typography";
import React, { Component } from "react";

const styles: StyleRules<"root"> = {
    root: {
        alignItems: "center",
        display: "flex",
        height: "15rem",
        justifyContent: "center",
    },
};

class Home extends Component<WithStyles<keyof typeof styles>> {
    public render() {
        const { classes } = this.props;
        return (
            <Typography className={classes.root}>
                Welcome to Rakuen.
            </Typography>
        );
    }
}

export default withStyles(styles)(Home);
