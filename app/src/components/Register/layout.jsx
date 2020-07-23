import React from 'react';
import { Container, Row, Col } from 'reactstrap';

function Layout({ children }) {
	return (
		<Container fluid>
			<Row className="show-grid">
				<Col lg={12}>
					<div style={{ backgroundImage: 'url(/images/sign-in-up.jpeg)', height: '100vh' }}> </div>
				</Col>
				<Col lg={12}>xs={2}</Col>
			</Row>
		</Container>
	);
}

export default Layout;
