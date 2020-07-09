import React, { Component } from 'react';
import { connect } from 'react-redux';
import RegisterLayout from '../../components/Register/layout';
import loginUser from '../../actions/loginUser';

class Login extends Component {
	state = {
		email: '',
		password: '',
		error: '',
		success: false
	};

	handleInputEmail = (event) => {
		this.setState({ email: event.target.value });
	};

	handleInputPassword = (event) => {
		this.setState({ password: event.target.value });
	};

	componentWillReceiveProps(nextProps) {
		if (nextProps.user.login.isAuth) {
			this.props.history.push('/dashboard');
		}
	}

	submitForm = (e) => {
		e.preventDefault();
		this.props.dispatch(loginUser(this.state));
	};

	render() {
		return (
			<RegisterLayout>
				<div className="rl_container">
					<form onSubmit={this.submitForm}>
						<h2>خوش آمدید</h2>
						<div className="form_element">
							<input
								type="email"
								placeholder="ایمیل خود را وارد کنید"
								value={this.state.email}
								onChange={this.handleInputEmail}
							/>
						</div>
						<div className="form_element">
							<input
								type="password"
								placeholder="گذرواژه خود را وارد کنید"
								value={this.state.password}
								onChange={this.handleInputPassword}
							/>
						</div>

						<button type="submit"> وارد شوید</button>
					</form>
				</div>
			</RegisterLayout>
		);
	}
}

function mapStateToProps(state) {
	return {
		user: state.user
	};
}

export default connect(mapStateToProps)(Login);
