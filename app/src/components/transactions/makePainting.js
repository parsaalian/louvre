import React, { Component } from 'react';
import { connect } from 'react-redux';
//import { Link } from 'react-router-dom'
import userMakePainting from '../../actions/makePainting';

class ChargeAccount extends Component {
	state = {
		privKey: ''
	};
	handleInputPrivKey = (event) => {
		this.setState({ privKey: event.target.value });
	};

	submitForm = (e) => {
		e.preventDefault();
		this.props.dispatch(
			userMakePainting({
				paintingKey: [ 0.1, 0.2, 0.3 ],
				privateKey: this.state.privKey
			})
		);
	};

	componentWillReceiveProps() {
		this.props.history.push('/dashboard');
	}

	render() {
		return (
			<div className="rl_container coin">
				<form onSubmit={this.submitForm}>
					<div className="form_element">
						<input
							type="password"
							placeholder=" کلید خصوصی خود را وارد نمایید"
							value={this.state.privKey}
							onChange={(event) => this.handleInputPrivKey(event)}
						/>
					</div>

					<button type="submit"> ارسال </button>
				</form>
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {
		privKey: state.privKey
	};
}

export default connect(mapStateToProps)(ChargeAccount);
