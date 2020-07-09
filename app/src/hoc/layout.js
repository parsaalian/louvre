import React from 'react';
// import Header from '../components/Header/header';

const Layout = (props) => {
	return (
		<div>
			<div>{props.children}</div>
		</div>
	);
};

export default Layout;
