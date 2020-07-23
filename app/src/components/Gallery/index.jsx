import _ from 'lodash';
import React, { Component } from 'react';
import { UncontrolledCarousel, Container, Row, Col, Spinner, Card, CardImg } from 'reactstrap';
import Unsplash, { toJson } from 'unsplash-js';

const unsplash = new Unsplash({
	accessKey: '1YNUDJvF0HQk3QSnp6eNNaKcz7TdS1OFByGQdMn5tag',
	timeout: 500
});

class Gallery extends Component {
	state = {
		photos: []
	};

	componentDidMount() {
		unsplash.search.photos('painting', 1, 10, { orientation: 'landscape' }).then(toJson).then((json) => {
			console.log(json.results);
			this.setState({
				photos: json.results
			});
		});
	}

	render() {
		const { photos } = this.state;
		return (
			<Container style={{ textAlign: 'center' }}>
				{_.isEmpty(photos) ? (
					<Row>
						<Spinner color="primary" />
					</Row>
				) : (
					<React.Fragment>
						<Row>
							<UncontrolledCarousel
								items={_.map(photos, (photo) => ({
									src: photo.links.download,
									captionText: photo.description
								}))}
							/>
						</Row>
						<Row>
							{_.map(photos, (photo) => {
								return (
									<Col lg={4} style={{ margin: '3rem auto' }}>
										<div
											style={{
												background: `url(${photo.links.download})`,
												height: '10rem'
											}}
										/>
									</Col>
								);
							})}
						</Row>
					</React.Fragment>
				)}
			</Container>
		);
	}
}

export default Gallery;
