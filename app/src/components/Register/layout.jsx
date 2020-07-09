import React from 'react';
import { Grid, Row, Col } from 'rsuite';

function Layout({ children }) {
	return (
		<Grid fluid>
			<Row className="show-grid">
				<Col lg={12}>
					<div style={{ backgroundImage: 'url(/images/sign-in-up.jpeg)', height: '100vh' }}> </div>
				</Col>
				<Col lg={12}>xs={2}</Col>
			</Row>
		</Grid>
	);
}

export default Layout;
