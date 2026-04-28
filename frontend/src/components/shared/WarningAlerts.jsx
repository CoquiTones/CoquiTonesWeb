import React from "react";
import { Alert, Snackbar, Button } from "@mui/material"

/**
 * 
 * @param {{warnings: Array, setWarnings: CallableFunction}} param0 
 * @returns 
 */
export default function WarningAlerts({ warnings, setWarnings }) {

    const handleCloseWarning = (warningMessage) => {
        const new_warnings = warnings.filter((warning) => warning !== warningMessage);
        setWarnings(new_warnings);
    };
    return (
        warnings &&
        warnings.length !== 0 &&
        warnings.map((warning, index) => (
            <Snackbar
                key={`warning-${index}`}
                open={warnings.length !== 0}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                sx={{
                    top: `${80 + index * 100}px !important`,
                }}
            >
                <Alert
                    severity="warning"
                    action={
                        <Button color="inherit" onClick={() => handleCloseWarning(warning)} >
                            Hide
                        </Button>
                    }
                >
                    {warning}
                </Alert>
            </Snackbar>
        ))
    )
}