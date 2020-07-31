import axios from "axios";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Table, Grid, Row, Input, InputGroup, Icon, Button } from "rsuite";

import changeForSale from "../actions/changeForSale";
import createOffer from "../actions/createOffer.js";
import acceptOffer from "../actions/acceptOffer.js";

const { Column, HeaderCell, Cell } = Table;

class Paint extends Component {
    constructor(props) {
        super(props);
        this.state = {
            privKey: "",
            offer: 0,
            loading: false,
            offers: [],
            painting: null,
        };
        this.handlePrivKey = (e) =>
            this.setState({
                privKey: e,
            });
        this.handleOffer = (e) =>
            this.setState({
                offer: e,
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
                    this.setState({ painting });
                    axios
                        .get(`/offers/getOffers/${match.params.id}`)
                        .then((response) => {
                            const offers = response.data.data.filter(
                                (d) =>
                                    JSON.stringify(d.paintingKey) ===
                                    JSON.stringify(painting.gene),
                            );
                            this.setState({ offers, loading: false });
                        });
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

    createOffer = (e) => {
        e.preventDefault();
        this.props.dispatch(
            createOffer({
                price: Number(this.state.offer),
                gene: this.state.painting.gene,
                buyerKey: this.props.user.login.pubKey,
                privateKey: this.state.privKey,
            }),
        );
    };

    acceptOffer = (buyerKey) => {
        this.props.dispatch(
            acceptOffer({
                gene: this.state.painting.gene,
                buyerKey,
                privateKey: this.state.privKey,
            }),
        );
    };

    render() {
        const { user } = this.props;
        const { loading, painting, privKey, offer, offers } = this.state;

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
                        alt={`generated from (${gene[0]}, ${gene[1]}, ${gene[2]})`}
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

                    {owner !== user.login.pubKey && forSale && (
                        <>
                            <Row
                                style={{
                                    textAlign: "center",
                                    marginTop: "1rem",
                                }}
                            >
                                <InputGroup inside>
                                    <Input
                                        placeholder="کلید خصوصی"
                                        type="password"
                                        value={privKey}
                                        onChange={this.handlePrivKey}
                                    />
                                </InputGroup>
                            </Row>
                            <Row
                                style={{
                                    textAlign: "center",
                                    marginTop: "1rem",
                                }}
                            >
                                <InputGroup inside>
                                    <Input
                                        placeholder="قیمت"
                                        type="number"
                                        value={offer}
                                        onChange={this.handleOffer}
                                    />
                                    <InputGroup.Button
                                        appearance="primary"
                                        onClick={this.createOffer}
                                    >
                                        <Icon icon="shopping-cart" />
                                    </InputGroup.Button>
                                </InputGroup>
                            </Row>
                        </>
                    )}
                    {offers.length > 0 && (
                        <Input
                            style={{ marginTop: "2rem" }}
                            placeholder="کلید خصوصی"
                            type="password"
                            value={privKey}
                            onChange={this.handlePrivKey}
                        />
                    )}
                    <Table height={400} data={offers}>
                        {owner === user.login.pubKey && (
                            <Column width={100} align="left" fixed>
                                <HeaderCell>وضعیت</HeaderCell>
                                <Cell>
                                    {(rowData) => (
                                        <Button
                                            appearance="primary"
                                            style={{ margin: "auto" }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                this.acceptOffer(
                                                    rowData.buyerKey,
                                                );
                                            }}
                                        >
                                            قبول کردن
                                        </Button>
                                    )}
                                </Cell>
                            </Column>
                        )}
                        <Column width={200} align="center" fixed>
                            <HeaderCell>قیمت</HeaderCell>
                            <Cell dataKey="offer" />
                        </Column>
                        <Column width={600} align="center" fixed>
                            <HeaderCell>کلید</HeaderCell>
                            <Cell dataKey="buyerKey" />
                        </Column>
                    </Table>
                </Grid>
            </React.Fragment>
        );
    }
}

export default connect()(Paint);
