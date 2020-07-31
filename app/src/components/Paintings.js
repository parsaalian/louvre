import axios from "axios";
import React, { Component } from "react";
import { Grid, Col, Row } from "rsuite";

class Paintings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            userLoading: false,
            userGallery: [],
        };
    }

    componentDidMount() {
        const { user } = this.props;
        if (!!user.login.pubKey) {
            this.setState({ userLoading: true });
            axios.get("/paintings/getUserPaintings").then((response) => {
                this.setState({ userGallery: response.data.data });
                this.setState({ userLoading: false });
            });
        }
    }

    render() {
        const { userLoading, userGallery } = this.state;
        if (userLoading) {
            return (
                <div style={{ textAlign: "center", marginTop: "2rem" }}>
                    <p>Loading...</p>
                </div>
            );
        }

        if (userGallery.length === 0) {
            return (
                <div style={{ textAlign: "center", marginTop: "2rem" }}>
                    <h1>نقاشی‌ای موجود نیست</h1>
                </div>
            );
        }

        return (
            <Grid>
                {userGallery.map((painting) => {
                    const { gene } = painting;
                    return (
                        <Col
                            sm={22}
                            md={8}
                            lg={8}
                            style={{
                                textAlign: "center",
                                marginTop: "2rem",
                            }}
                        >
                            <img
                                src={`/images/generated/${Number(
                                    Number(
                                        ((gene[0] + gene[1] + gene[2]) *
                                            214.99) /
                                            3,
                                    ).toFixed(0),
                                )}.png`}
                            />
                        </Col>
                    );
                })}
            </Grid>
        );
    }
}

export default Paintings;
