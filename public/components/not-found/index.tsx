import { StyleRules, withStyles, WithStyles } from "material-ui/styles";
import Typography from "material-ui/Typography";
import React from "react";
import { RouteComponentProps } from "react-router-dom";

const styles: StyleRules<"root"> = {
    root: {
        alignItems: "center",
        display: "flex",
        height: "15rem",
        justifyContent: "center",
    },
};

class NotFound extends React.PureComponent<RouteComponentProps<{}> & WithStyles<keyof typeof styles>> {
    public componentWillMount() {
        const { staticContext } = this.props;
        if (staticContext) {
            staticContext.notFound = true;
        }
    }

    public render() {
        const { classes } = this.props;
        return (
            <Typography className={classes.root}>
                The page you’re looking for can’t be found.
            </Typography>
        );
    }
}

export default withStyles(styles)(NotFound);
