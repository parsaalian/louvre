submitForm = (e) => {
	e.preventDefault();
	this.props.dispatch(
		userMakeOffer({
			privateKey: this.state.privateKey,
			paintingKey: this.state.paintingKey,
			offer: this.state.offer
		})
	);
};
