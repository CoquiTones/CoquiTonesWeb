import React, { createContext, useState, } from 'react';

export const ErrorContext = createContext();

export const ErrorProvider = ({ children }) => {
    const [errors, setErrors] = useState([]);
    return (
        <ErrorContext.Provider value={{ errors: errors, setErrors: setErrors }}>
            {children}
        </ErrorContext.Provider>
    );
};
