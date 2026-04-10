import React, { useState, useMemo } from "react";
import { Alert, Snackbar, Button } from "@mui/material"

/**
 * 
 * errors = list of objects with error and action keys like so 
 * [{error: APIHandlerError(), action: callbackToAttemptFix}]
 * @returns 
 */
export default function ErrorAlerts({ errors , setErrors}) {

    const handleCloseWarning = (errorMesseage) => {
    const new_errors = errors.filter((error) => error.message !== errorMesseage);
    console.log("New Errors: ", new_errors)
    setErrors(new_errors);
  };
    return (
        errors &&
        errors.length !== 0 &&
        errors.map((error, index) => (
          <Snackbar
            key={`error-${index}`}
            open={errors.length !== 0}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            sx={{
              top: `${80 + index * 100}px !important`,
            }}
          >
            <Alert
              severity="error"
              action={
                <Button color="inherit" onClick={() => handleCloseWarning(error.message)} >
                    Hide
                </Button>
              }
            >
              {error.message}
            </Alert>
          </Snackbar>
        ))
    )
}