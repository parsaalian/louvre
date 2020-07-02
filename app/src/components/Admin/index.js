import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import 'react-table/react-table.css';
import userRegisterBlockchain from '../../actions/userRegisterBlockchain';

const secp256k1 = require('sawtooth-sdk/signing/secp256k1');
const { createAccount, submit } = require('../transactions/transactions');

const User = (props) => {
	const [ userInfo, setUserInfo ] = useState({});
	const [ userLoading, setUserLoading ] = useState(false);

	const getKeyPair = () => {
		const context = new secp256k1.Secp256k1Context();
		const privateKey = context.newRandomPrivateKey();
		const privateKeyHex = privateKey.asHex();
		const publicKey = context.getPublicKey(privateKey).asHex();
		return [ publicKey, privateKeyHex ];
	};
	const createKeys = () => {
		const keys = getKeyPair();
		let transaction = createAccount(keys[1]);
		transaction = Buffer.from(transaction).toString('base64');
		submit({ txn: transaction }, true).then((res) => {
			if (res.data.success === true) {
				props.dispatch(userRegisterBlockchain({ publicKey: keys[0] }));
				alert(' کلید خصوصی شما: ' + keys[1]);
			}
		});
	};

	useEffect(
		() => {
			console.log(props.user.login.pubKey, !!props.user.login.pubKey);

			if (!!props.user.login.pubKey) {
				setUserLoading(true);
				axios.get(`/user/getUserInfo`).then((response) => {
					console.log(1);
					console.log(response.data.data);
					setUserInfo(response.data.data);
				});
				axios.get('/paintings/getUserPaintings').then((response) => {
					console.log(response.data);
					setUserLoading(false);
				});
			}
		},
		[ props.user.login.pubKey ]
	);
	return (
		<div className="user_container">
			<div className="nfo">
				<div>
					<span>ایمیل: </span>
					{props.user.login.email}
				</div>
				<div>
					<span>کلید عمومی: </span>
					{props.user.login.pubKey}
				</div>
				<div>
					<span>موجودی : </span>
					{userLoading ? 'loading...' : userInfo.balance}
				</div>
			</div>
			<div>
				<button onClick={() => createKeys()}>تولید کلید</button>
			</div>
		</div>
	);
};

function mapStateToProps(state) {
	return {
		users: state.user
	};
}

export default connect(mapStateToProps)(User);
