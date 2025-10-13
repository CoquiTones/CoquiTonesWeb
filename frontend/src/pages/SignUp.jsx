import React, { useState, Fragment } from 'react';
import Cookies from 'js-cookie';
import {
	Modal,
	Box,
	Typography,
	TextField,
	Button,
	Stack,
	Divider,
	styled,
	CssBaseline,
	Container,
	Grid2
} from '@mui/material';
import Sidebar from "../components/shared/Sidebar";

import logo from "../components/assets/images/logo512.png";
import Navbar from "../components/shared/Navbar";
import Footer from "../components/shared/Footer";
import { APIHandlerAuthentication } from '../services/rest/APIHandler/APIHandlerAuthentication';
import { SignUpRequest } from '../services/rest/RequestORM/Authentication/SignUpRequest';

const SignUpPage = () => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [isOpen, setIsOpen] = useState(false);
	const toggle = () => {
		setIsOpen(!isOpen);
	};
	const handleSignUp = async () => {
		try {

			const handler = new APIHandlerAuthentication();
			const signupRequest = new SignUpRequest(username, password);
			const successfullyAuthenticatedStatus = await handler.SignUpNewUser(signupRequest);

			if (successfullyAuthenticatedStatus) {
				alert('Successfully Signed Up!!'); // obviously change this to something pretty 
				handleClose();
			}
			else {
				alert('Some Fucking Error Happened!') // obviously change this to something pretty 
			}
		} catch (error) {
			// Handle authentication errors
			console.error('Sign-in error:', error);
		}
	};

	const handleClose = () => {

		setOpen(!open)
	}
	return (
		<Fragment>

			<Sidebar isOpen={isOpen} toggle={toggle} />
			<Navbar toggle={toggle} />
			<Box sx={{ display: "flex", width: "100%" }}>
				<CssBaseline />
				<Container>
					<Grid2>
						<img src={logo}></img>
						<Typography
							id="sign-in-modal-title"
							variant="h6"
							component="h2"
							align='center'
							sx={{
								color: "#ffc857",
								cursor: 'pointer',
								fontSize: '1.5rem',
								fontWeight: 'bold',
								TextDecoration: 'none'
							}}>
							Sign In
						</Typography>
						<TextField
							fullWidth
							margin="normal"
							label="Username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
						/>
						<TextField
							fullWidth
							margin="normal"
							type="password"
							label="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>

						<Stack spacing={2} sx={{ mt: 2 }}>
							<Button
								variant="contained"
								onClick={handleSignUp}
								fullWidth
								sx={{ mt: 2 }}
							>
								Sign Up
							</Button>
						</Stack>

					</Grid2>
				</Container>
			</Box>
		</Fragment>


	);
};

export default SignUpPage;
