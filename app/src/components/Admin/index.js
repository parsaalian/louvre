import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, List, FlexboxGrid, Icon, Button } from "rsuite";
import Paintings from "../Paintings";

import userRegisterBlockchain from "../../actions/userRegisterBlockchain";

const secp256k1 = require("sawtooth-sdk/signing/secp256k1");
const { createAccount, submit } = require("../transactions/transactions");

const User = (props) => {
    const [userInfo, setUserInfo] = useState({});
    const [userLoading, setUserLoading] = useState(false);

    const getKeyPair = () => {
        const context = new secp256k1.Secp256k1Context();
        const privateKey = context.newRandomPrivateKey();
        const privateKeyHex = privateKey.asHex();
        const publicKey = context.getPublicKey(privateKey).asHex();
        return [publicKey, privateKeyHex];
    };
    const createKeys = () => {
        const keys = getKeyPair();
        console.log(keys);
        let transaction = createAccount(keys[1]);
        transaction = Buffer.from(transaction).toString("base64");
        submit({ txn: transaction }, true).then((res) => {
            if (res.data.success === true) {
                props.dispatch(userRegisterBlockchain({ publicKey: keys[0] }));
                alert(" کلید خصوصی شما: " + keys[1]);
            }
        });
    };

    useEffect(() => {
        if (!!props.user.login.pubKey) {
            setUserLoading(true);
            axios.get(`/user/getUserInfo`).then((response) => {
                setUserInfo(response.data.data);
                setUserLoading(false);
            });
        }
    }, [props.user.login.pubKey]);

    return (
        <React.Fragment>
            <Container>
                <List>
                    <List.Item>
                        <FlexboxGrid>
                            <FlexboxGrid.Item colspan={2}></FlexboxGrid.Item>
                            <FlexboxGrid.Item colspan={1}>
                                <Icon icon="envelope" />
                            </FlexboxGrid.Item>
                            <FlexboxGrid.Item colspan={4}>
                                ایمیل
                            </FlexboxGrid.Item>
                            <FlexboxGrid.Item colspan={4}>
                                {props.user.login.email}
                            </FlexboxGrid.Item>
                        </FlexboxGrid>

                        <FlexboxGrid>
                            <FlexboxGrid.Item colspan={2}></FlexboxGrid.Item>
                            <FlexboxGrid.Item colspan={1}>
                                <Icon icon="key" />
                            </FlexboxGrid.Item>
                            <FlexboxGrid.Item colspan={4}>
                                کلید عمومی
                            </FlexboxGrid.Item>
                            <FlexboxGrid.Item colspan={4}>
                                {props.user.login.pubKey}
                            </FlexboxGrid.Item>
                        </FlexboxGrid>

                        <FlexboxGrid>
                            <FlexboxGrid.Item colspan={2}></FlexboxGrid.Item>
                            <FlexboxGrid.Item colspan={1}>
                                <Icon icon="money" />
                            </FlexboxGrid.Item>
                            <FlexboxGrid.Item colspan={4}>
                                موجودی
                            </FlexboxGrid.Item>
                            <FlexboxGrid.Item colspan={4}>
                                {userLoading ? "loading..." : userInfo.balance}
                            </FlexboxGrid.Item>
                        </FlexboxGrid>

                        <FlexboxGrid>
                            <FlexboxGrid.Item colspan={18}></FlexboxGrid.Item>
                            <FlexboxGrid.Item>
                                <Button
                                    appearance="primary"
                                    onClick={createKeys}
                                >
                                    تولید کلید
                                </Button>
                            </FlexboxGrid.Item>
                        </FlexboxGrid>
                    </List.Item>
                </List>
            </Container>
            <Paintings user={props.user} />
        </React.Fragment>
    );
};

export default User;
