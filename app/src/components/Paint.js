import axios from "axios";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Grid, Row, Input, InputGroup, Icon } from "rsuite";

import changeForSale from "../actions/changeForSale";

class Paint extends Component {
    constructor(props) {
        super(props);
        this.state = {
            privKey: "",
            loading: false,
            offers: [],
            painting: null,
        };
        this.handlePrivKey = (e) =>
            this.setState({
                privKey: e,
            });
    }

    componentDidMount() {
        const { user, match } = this.props;
        this.setState({ loading: true });
        if (!!user.login.pubKey) {
            this.setState({ userLoading: true });
            axios
                .get(`/paintings/getPainting/${match.params.id}`)
                .then((response) => {
                    const painting = response.data.data[0];
                    console.log(painting);
                    this.setState({ painting, loading: false });
                });
        }
    }

    changeForSale = (e) => {
        e.preventDefault();
        this.props.dispatch(
            changeForSale({
                privateKey: this.state.privKey,
                paintingKey: this.state.painting.gene,
            }),
        );
    };

    render() {
        const { user } = this.props;
        const { loading, painting, privKey } = this.state;

        if (loading) {
            return (
                <div style={{ textAlign: "center", marginTop: "2rem" }}>
                    <p>Loading...</p>
                </div>
            );
        }

        const { owner, gene, forSale } = painting || {
            gene: [],
            owner: null,
            forSale: false,
        };

        return (
            <React.Fragment>
                <div style={{ marginTop: "2rem", textAlign: "center" }}>
                    <img
                        src={`/images/generated/${Number(
                            Number(
                                ((gene[0] + gene[1] + gene[2]) * 214.99) / 3,
                            ).toFixed(0),
                        )}.png`}
                        style={{ width: "30%", height: "auto" }}
                    />
                </div>
                <Grid>
                    <Row style={{ textAlign: "center", marginTop: "2rem" }}>
                        صاحب اثر: {owner === user.login.pubKey ? "شما" : owner}
                    </Row>
                    <Row style={{ textAlign: "center", marginTop: "1rem" }}>
                        وضعیت فروش: {forSale ? "قابل فروش" : "غیرقابل فروش"}
                    </Row>
                    {owner === user.login.pubKey && !forSale && (
                        <Row style={{ textAlign: "center", marginTop: "1rem" }}>
                            <InputGroup inside>
                                <Input
                                    placeholder="کلید خصوصی"
                                    type="password"
                                    value={privKey}
                                    onChange={this.handlePrivKey}
                                />
                                <InputGroup.Button
                                    appearance="primary"
                                    onClick={this.changeForSale}
                                >
                                    <Icon
                                        icon={`toggle-${
                                            forSale ? "on" : "off"
                                        }`}
                                    />
                                </InputGroup.Button>
                            </InputGroup>
                        </Row>
                    )}
                </Grid>
            </React.Fragment>
        );
    }
}

export default connect()(Paint);
