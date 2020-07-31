import React, { Component } from "react";
import { connect } from "react-redux";
//import { Link } from 'react-router-dom'
import {
    Grid,
    Row,
    Col,
    Form,
    FormGroup,
    ControlLabel,
    Input,
    Slider,
    Button,
} from "rsuite";
import userCreatePainting from "../../actions/createPainting";

class ChargeAccount extends Component {
    constructor(props) {
        super(props);

        this.state = {
            privKey: "",
            changed: false,
            random1: 0,
            random2: 0,
            random3: 0,
        };

        this.handlePrivKey = (e) =>
            this.setState({
                privKey: e,
            });
        this.handleRandom1 = (e) =>
            this.setState({
                changed: true,
                random1: e,
            });
        this.handleRandom2 = (e) =>
            this.setState({
                changed: true,
                random2: e,
            });
        this.handleRandom3 = (e) =>
            this.setState({
                changed: true,
                random3: e,
            });
    }

    componentWillReceiveProps() {
        this.props.history.push("/dashboard");
    }

    submitForm = (e) => {
        e.preventDefault();
        const { privKey, random1, random2, random3 } = this.state;
        this.props.dispatch(
            userCreatePainting({
                paintingKey: [random1, random2, random3],
                privateKey: privKey,
            }),
        );
    };

    render() {
        const { privKey, changed, random1, random2, random3 } = this.state;

        return (
            <Grid
                fluid
                style={{
                    height: "calc(100vh - 5rem - 56px)",
                    marginTop: "5rem",
                }}
            >
                <Row>
                    <Col sm={24} md={12} lg={12} style={{ padding: "2rem" }}>
                        <Form>
                            <FormGroup>
                                <ControlLabel>
                                    کلید خصوصی خود را وارد نمایید
                                </ControlLabel>
                                <Input
                                    type="password"
                                    value={privKey}
                                    onChange={this.handlePrivKey}
                                />
                            </FormGroup>
                            <FormGroup>
                                <ControlLabel>عدد تصادفی اول</ControlLabel>
                                <Slider
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={random1}
                                    onChange={this.handleRandom1}
                                />
                            </FormGroup>
                            <FormGroup>
                                <ControlLabel>عدد تصادفی دوم</ControlLabel>
                                <Slider
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={random2}
                                    onChange={this.handleRandom2}
                                />
                            </FormGroup>
                            <FormGroup>
                                <ControlLabel>عدد تصادفی سوم</ControlLabel>
                                <Slider
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={random3}
                                    onChange={this.handleRandom3}
                                />
                            </FormGroup>
                            <Button
                                appearance="primary"
                                onClick={this.submitForm}
                            >
                                تولید نقاشی
                            </Button>
                        </Form>
                    </Col>
                    <Col
                        sm={24}
                        md={12}
                        lg={12}
                        style={{ padding: "2rem", textAlign: "center" }}
                    >
                        <img
                            src={
                                !changed
                                    ? "/images/createPainting.png"
                                    : `/images/generated/${Number(
                                          Number(
                                              ((random1 + random2 + random3) *
                                                  214.99) /
                                                  3,
                                          ).toFixed(0),
                                      )}.png`
                            }
                            style={{ width: "80%", height: "auto" }}
                        />
                    </Col>
                </Row>
            </Grid>
        );
    }
}

function mapStateToProps(state) {
    return {
        privKey: state.privKey,
    };
}

export default connect(mapStateToProps)(ChargeAccount);
