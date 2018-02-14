import Grid from "material-ui/Grid";
import { StyleRules, withStyles, WithStyles } from "material-ui/styles";
import Typography from "material-ui/Typography";
import React from "react";

const styles: StyleRules<"link" | "root" | "text"> = {
    link: {
        "&:hover": {
            textDecoration: "underline",
        },
        "color": "inherit",
        "textDecoration": "none",
    },
    root: {
        justifyContent: "center",
        marginBottom: "1rem",
        marginTop: "1rem",
    },
    text: {
        maxWidth: "62.5rem",
    },
};

const Footer = ({ classes }: WithStyles<keyof typeof styles>) => (
    <Grid container className={classes.root} component="footer">
        <Grid
            item
            xs={12}
            component={({ children }) => <Typography variant="body1">{children}</Typography>}
            className={classes.text}>
            &copy; <a className={classes.link} href="https://mudkip.me/">Mudkip</a>
        </Grid>
    </Grid>
);

export default withStyles(styles)<{}>(Footer);
