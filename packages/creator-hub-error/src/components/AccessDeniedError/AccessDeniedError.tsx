import React, { FunctionComponent } from "react";
import { useTranslation } from "@rbx/intl";
import { Grid, Typography } from "@rbx/ui";
import { ErrorIllustration } from "../../utils";
import useAccessDeniedErrorStyles from "./AccessDeniedError.styles";

const AccessDeniedError: FunctionComponent = () => {
  const { translate } = useTranslation();
  const {
    classes: { background },
  } = useAccessDeniedErrorStyles();
  return (
    <Grid
      container
      classes={{ root: background }}
      direction="column"
      alignItems="center"
    >
      <Grid container item justifyContent="center">
        <img
          src={ErrorIllustration}
          alt="Error Illustration"
          width="192px"
          height="192px"
        />
      </Grid>
      <Grid
        container
        item
        direction="column"
        justifyContent="center"
        alignItems="center"
      >
        <Typography variant="h6" align="center">
          {translate("Heading.AccessDenied")}
        </Typography>
        <Typography color="secondary" align="center">
          {translate("Description.AccessDenied")}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default AccessDeniedError;
