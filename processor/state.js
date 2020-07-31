const pb = require("protobufjs");
const {
    createAccountAddress,
    createOfferAddress,
    createPaintingAddress,
} = require("../addressing/address");
const { logger } = require("./logger");

class BC98State {
    constructor(context) {
        this.context = context;
        this.addressCache = new Map([]);
    }

    encodeFunction(payload, pathFile, pathMessage) {
        try {
            const root = pb.loadSync(pathFile);
            const file = root.lookup(pathMessage);
            let message = [];
            let data = [];
            payload.forEach((element, index) => {
                message.push(file.create(element));
                data[index] = file.encode(message[index]).finish();
            });
            return data;
        } catch (err) {
            const message = err.message ? err.message : err;
            logger.error(
                "Something bad happened while encoding:" + " " + message,
            );
            throw new Error(
                "Something bad happened while encoding:" + " " + err,
            );
        }
    }

    // //////////////////////////////////////////////////////////////////////
    // ########## Load and Get Messages #######################
    // /////////////////////////////////////////////////////////////////////

    loadMessage(key, pathFile, pathMessage) {
        let address;
        switch (pathMessage) {
            case "Account":
                address = createAccountAddress(key);
                break;
            case "Offer":
                address = createOfferAddress(key);
                break;
            case "Painting":
                address = createPaintingAddress(key);
                break;
            default:
                logger.warn("Bad Message!");
                break;
        }
        if (this.addressCache.has(address)) {
            if (this.addressCache.get(address) === null) {
                return Promise.resolve(new Map([]));
            } else {
                return Promise.resolve(
                    pb
                        .load(pathFile)
                        .then((root) => {
                            let map = new Map([]);
                            const file = root.lookup(pathMessage);
                            const dec = file.decode(
                                this.addressCache.get(address),
                            );
                            const decObject = file.toObject(dec);
                            return map.set(address, decObject);
                        })
                        .catch((err) => {
                            const message = err.message ? err.message : err;
                            logger.error(
                                `${pathFile} is not loading!: ${message}`,
                            );
                            throw new Error(
                                `${pathFile} is not loading!:` + " " + err,
                            );
                        }),
                );
            }
        } else {
            return this.context
                .getState([address])
                .then((addressValue) => {
                    if (!addressValue[address]) {
                        this.addressCache.set(address, null);
                        return Promise.resolve(new Map([]));
                    } else {
                        let data = addressValue[address];
                        this.addressCache.set(address, data);
                        return pb
                            .load(pathFile)
                            .then((root) => {
                                var map = new Map([]);
                                const file = root.lookup(pathMessage);
                                const dec = file.decode(data);
                                const decObject = file.toObject(dec);
                                return map.set(address, decObject);
                            })
                            .catch((err) => {
                                const message = err.message ? err.message : err;
                                logger.error(
                                    `${pathFile} is not loading!: ${message}`,
                                );
                                throw new Error(
                                    `${pathFile} is not loading!:` + " " + err,
                                );
                            });
                    }
                })
                .catch((err) => {
                    const message = err.message ? err.message : err;
                    logger.error(
                        `getState in blockchain is not responding!: ${message}`,
                    );
                    throw new Error(
                        "getState in blockchain is not responding!:" +
                            " " +
                            err,
                    );
                });
        }
    }

    getMessage(key, pathMessage) {
        let address;
        let pathFile;
        switch (pathMessage) {
            case "Account":
                address = createAccountAddress(key);
                pathFile = "../protos/account.proto";
                break;
            case "Offer":
                address = createOfferAddress(key);
                pathFile = "../protos/offer.proto";
                break;
            case "Painting":
                address = createPaintingAddress(key);
                pathFile = "../protos/painting.proto";
                break;
            default:
                logger.warn("Bad Message!");
                break;
        }
        return this.loadMessage(key, pathFile, pathMessage)
            .then((elements) => elements.get(address))
            .catch((err) => {
                const message = err.message ? err.message : err;
                logger.error(`loadMessage has some problems: ${message}`);
                throw new Error("loadMessage has some problems:" + " " + err);
            });
    }

    // //////////////////////////////////////////////////////////////////////
    // ########## Set Accounts #######################
    // /////////////////////////////////////////////////////////////////////

    setAccount(label, pubKey) {
        try {
            const payloadAccount = {
                publickey: pubKey,
                label: [label],
                balance: "0",
            };
            const dataAccount = this.encodeFunction(
                [payloadAccount],
                "../protos/account.proto",
                "Account",
            );
            const addressAccount = createAccountAddress(pubKey);
            this.addressCache.set(addressAccount, dataAccount[0]);

            let entries = {
                [addressAccount]: dataAccount[0],
            };
            return this.context.setState(entries);
        } catch (err) {
            const message = err.message ? err.message : err;
            logger.error(
                `setState in setAccount has some problems: ${message}`,
            );
            throw new Error(
                "setState in setAccount has some problems:" + " " + err,
            );
        }
    }

    // //////////////////////////////////////////////////////////////////////
    // ########## Set Charge #######################
    // /////////////////////////////////////////////////////////////////////

    setCharge(amount, pubKey) {
        return this.getMessage(pubKey, "Account")
            .then((accountValue) => {
                if (!accountValue || accountValue.publickey !== pubKey) {
                    logger.error("No Account exists in setCharge!");
                    throw new Error("The Account is not valid!");
                }

                const balance = (
                    Number(accountValue.balance) + Number(amount)
                ).toFixed(3);

                const payloadAccount = {
                    publickey: accountValue.publickey,
                    label: accountValue.label,
                    balance: balance,
                };

                const dataAccount = this.encodeFunction(
                    [payloadAccount],
                    "../protos/account.proto",
                    "Account",
                );

                const addressAccount = createAccountAddress(pubKey);

                this.addressCache.set(addressAccount, dataAccount[0]);

                let entries = {
                    [addressAccount]: dataAccount[0],
                };
                logger.info("The balance is changing to: " + balance);
                return this.context.setState(entries);
            })
            .catch((err) => {
                let message = err.message ? err.message : err;
                logger.error(
                    `getAccount in blockchain is not responding!: ${message}`,
                );
                throw new Error(
                    "getAccount in blockchain is not responding!:" + " " + err,
                );
            });
    }

    createPainting(paintingKey, ownerKey) {
        try {
            const paintingPayload = {
                owner: ownerKey,
                gene: paintingKey,
                forSale: false,
            };
            const paintingData = this.encodeFunction(
                [paintingPayload],
                "../protos/painting.proto",
                "Painting",
            );
            const paintingAddress = createPaintingAddress(paintingKey);
            this.addressCache.set(paintingAddress, paintingData[0]);

            let entries = {
                [paintingAddress]: paintingData[0],
            };
            return this.context.setState(entries);
        } catch (err) {
            const message = err.message ? err.message : err;
            logger.error(
                `setState in createPainting has some problems: ${message}`,
            );
            throw new Error(
                "setState in createPainting has some problems:" + " " + err,
            );
        }
    }

    makeOffer(paintingKey, buyerKey, offer) {
        try {
            const offerPayload = {
                paintingKey,
                buyerKey,
                offer,
                accepted: false,
            };
            const offerData = this.encodeFunction(
                [offerPayload],
                "../protos/offer.proto",
                "Offer",
            );
            const offerAddress = createOfferAddress(
                JSON.stringify([paintingKey, buyerKey]),
            );
            this.addressCache.set(offerAddress, offerData[0]);

            return this.context.setState({
                [offerAddress]: offerData[0],
            });
        } catch (err) {
            const message = err.message || err;
            logger.error(`setState in makeOffer has some problems: ${message}`);
            throw new Error(`setState in makeOffer has some problems: ${err}`);
        }
    }

    acceptOffer(paintingKey, buyerKey) {
        return this.getMessage(JSON.stringify([paintingKey, buyerKey]), "Offer")
            .then((offerValue) => {
                if (!offerValue) {
                    logger.error("No offer with these attributes found!");
                    throw new Error("Painting attributes are not valid!");
                }

                const offerAmount = Number(offerValue.offer);

                return this.getMessage(buyerKey, "Account")
                    .then((buyerValue) => {
                        if (Number(buyerValue.balance) < offerAmount) {
                            logger.error("Buyer does not have enough balance.");
                            throw new Error("Not enough balance.");
                        }

                        return this.getMessage(paintingKey, "Painting")
                            .then((paintingValue) => {
                                return this.getMessage(
                                    paintingValue.owner,
                                    "Account",
                                ).then((sellerValue) => {
                                    const sellerPayload = {
                                        ...sellerValue,
                                        balance: String(
                                            Number(sellerValue.balance) +
                                                Number(offerAmount),
                                        ),
                                    };

                                    const buyerPayload = {
                                        ...buyerValue,
                                        balance: String(
                                            Number(buyerValue.balance) -
                                                Number(offerAmount),
                                        ),
                                    };

                                    const paintingPayload = {
                                        ...paintingValue,
                                        owner: buyerPayload.publickey,
                                    };

                                    const sellerData = this.encodeFunction(
                                        [sellerPayload],
                                        "../protos/account.proto",
                                        "Account",
                                    );

                                    const sellerAddress = createAccountAddress(
                                        paintingValue.owner,
                                    );

                                    const buyerData = this.encodeFunction(
                                        [buyerPayload],
                                        "../protos/account.proto",
                                        "Account",
                                    );
                                    const buyerAddress = createAccountAddress(
                                        buyerKey,
                                    );

                                    const paintingData = this.encodeFunction(
                                        [paintingPayload],
                                        "../protos/painting.proto",
                                        "Painting",
                                    );
                                    const paintingAddress = createPaintingAddress(
                                        paintingKey,
                                    );

                                    this.addressCache.set(
                                        sellerAddress,
                                        sellerData[0],
                                    );
                                    this.addressCache.set(
                                        buyerAddress,
                                        buyerData[0],
                                    );
                                    this.addressCache.set(
                                        paintingAddress,
                                        paintingData[0],
                                    );

                                    logger.info(
                                        `Painting ${paintingKey} is changing ownership from player ${paintingValue.owner} to ${buyerKey}`,
                                    );

                                    return this.context
                                        .setState({
                                            [sellerAddress]: sellerData[0],
                                            [buyerAddress]: buyerData[0],
                                            [paintingAddress]: paintingData[0],
                                        })
                                        .catch((err) => {
                                            throw err;
                                        });
                                });
                            })
                            .catch((err) => {
                                throw err;
                            });
                    })
                    .catch((err) => {
                        throw err;
                    });
            })
            .catch((err) => {
                const message = err.message || err;
                logger.error(
                    `getOffer in blockchain is not responding: ${message}`,
                );
                throw new Error(
                    `getOffer in blockchain is not responding: ${err}`,
                );
            });
    }

    makeOfferable(paintingKey) {
        return this.getMessage(paintingKey, "Painting")
            .then((paintingValue) => {
                if (!paintingKey) {
                    logger.error("No such painting exists in!");
                    throw new Error("The gene is not valid!");
                }

                const payloadPainting = {
                    owner: paintingValue.owner,
                    gene: paintingValue.gene,
                    forSale: true,
                };

                const dataPainting = this.encodeFunction(
                    [payloadPainting],
                    "../protos/painting.proto",
                    "Painting",
                );

                const addressPainting = createPaintingAddress(
                    paintingValue.gene,
                );

                this.addressCache.set(addressPainting, dataPainting[0]);

                return this.context.setState({
                    [addressPainting]: dataPainting[0],
                });
            })
            .catch((err) => {
                let message = err.message ? err.message : err;
                logger.error(
                    `makeOfferable in blockchain is not responding!: ${message}`,
                );
                throw new Error(
                    "makeOfferable in blockchain is not responding!:" +
                        " " +
                        err,
                );
            });
    }
}

module.exports = {
    BC98State,
};
