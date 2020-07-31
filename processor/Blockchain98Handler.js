const { TransactionHandler } = require("sawtooth-sdk/processor/handler");
const {
    InternalError,
    InvalidTransaction,
} = require("sawtooth-sdk/processor/exceptions");
const pb = require("protobufjs");
require("dotenv").config();

const { BC98State } = require("./state");
const { logger } = require("./logger");

const MIN_VALUE = process.env.MIN_VALUE;
const PG_FAMILY = process.env.PG_FAMILY;
const PG_VERSION = process.env.PG_VERSION;
const PG_NAMESPACE = process.env.PG_NAMESPACE;

// Function to obtain the payload obtained from client

const _decodeRequest = (payload) => {
    if (
        payload === undefined ||
        payload === null ||
        !Buffer.isBuffer(payload)
    ) {
        const error = new Error("The payload is not valid.");
        throw error;
    }
    return pb
        .load("../protos/payload.proto")
        .then((root) => {
            const file = root.lookup("PGPayload");
            const dec = file.decode(payload);
            return dec;
        })
        .catch((err) => {
            const message = err.message ? err.message : err;
            logger.error(
                'Loading proto file "payload.proto" and decoding has some errors:' +
                    " " +
                    message,
            );
            throw new Error(
                'Loading proto file "payload.proto" and decoding has some errors:' +
                    " " +
                    err,
            );
        });
};

// Function to display the errors

const _toInternalError = (err) => {
    logger.info("in error message block");
    const message = err.message ? err.message : err;
    logger.error(message);
    throw new InternalError(message);
};

class Blockchain98Handler extends TransactionHandler {
    constructor() {
        super(PG_FAMILY, [PG_VERSION], [PG_NAMESPACE]);
    }

    apply(transactionProcessRequest, context) {
        return _decodeRequest(transactionProcessRequest.payload)
            .then((update) => {
                let header = transactionProcessRequest.header;
                let txId = transactionProcessRequest.signature;
                let userPublicKey = header.signerPublicKey;
                let bC98State = new BC98State(context);
                let action = update.action;
                let timestamp = update.timestampClient;
                console.log(update);
                if (!action) {
                    logger.error("Action is required!");
                    throw new Error("Action is required!");
                }

                const createAccount = (label, publicKey) => {
                    if (label !== "USER") {
                        const error = new Error("The label is not valid.");
                        return error;
                    }
                    if (publicKey !== userPublicKey) {
                        const error = new Error("The publickey is not valid.");
                        throw error;
                    }
                    logger.info("Creating Account for " + publicKey);
                    return bC98State
                        .getMessage(publicKey, "Account")
                        .catch((err) => {
                            const message = err.message ? err.message : err;
                            logger.error(
                                `getAccount in blockchain is not responding!: ${message}`,
                            );
                            throw new Error(
                                `getAccount in blockchain is not responding!: ${message}`,
                            );
                        })
                        .then((accountValue) => {
                            if (
                                accountValue &&
                                accountValue.publickey !== undefined
                            ) {
                                logger.error("Account Already exists!!");
                                throw new Error("Account Already exists!!");
                            }
                            return bC98State.setAccount(label, publicKey);
                        });
                };

                const chargeAccount = (amount, publicKey) => {
                    if (
                        isNaN(Number(amount)) ||
                        !Number.isInteger(Number(amount))
                    ) {
                        throw new Error("The amount is not valid!");
                    }
                    logger.info(
                        "Charging Account : " + publicKey + " with " + amount,
                    );
                    return bC98State.setCharge(amount, publicKey);
                };

                const createPainting = (paintingKey) => {
                    return bC98State
                        .getMessage(paintingKey, "Painting")
                        .catch((err) => {
                            const message = err.message ? err.message : err;
                            logger.error(
                                `getAccount in blockchain is not responding!: ${message}`,
                            );
                            throw new Error(
                                `getAccount in blockchain is not responding!: ${message}`,
                            );
                        })
                        .then((paintingValue) => {
                            if (
                                paintingValue &&
                                paintingValue.gene !== undefined &&
                                paintingValue.gene == paintingKey
                            ) {
                                logger.error("Painting Already exists!!");
                                throw new Error("Painting Already exists!!");
                            }
                            logger.info(
                                "Creating Painting " +
                                    paintingKey +
                                    " for " +
                                    userPublicKey,
                            );
                            return bC98State.createPainting(
                                paintingKey,
                                userPublicKey,
                            );
                        });
                };

                const createOffer = (offer, paintingKey, buyerKey) => {
                    return bC98State
                        .getMessage(
                            JSON.stringify([paintingKey, buyerKey]),
                            "Offer",
                        )
                        .catch((err) => {
                            const message = err.message || err;
                            logger.error(
                                `makeOffer in blockchain is not responding: ${message}`,
                            );
                            throw new Error(
                                `makeOffer in blockchain is not responding: ${err}`,
                            );
                        })
                        .then((offerValue) => {
                            console.log(offerValue);
                            if (
                                JSON.stringify(offerValue) !==
                                JSON.stringify({})
                            ) {
                                logger.error("Offer Already exists!!");
                                throw new Error("Offer Already exists!!");
                            }

                            console.log(paintingKey, buyerKey, offer);

                            return bC98State.makeOffer(
                                paintingKey,
                                buyerKey,
                                offer,
                            );
                        });
                };

                const acceptOffer = (paintingKey, buyerKey) => {
                    return bC98State
                        .getMessage(paintingKey, "Painting")
                        .catch((err) => {
                            const message = err.message || err;
                            logger.error(
                                `acceptOffer in blockchain is not responding: ${message}`,
                            );
                            throw new Error(
                                `acceptOffer in blockchain is not responding: ${err}`,
                            );
                        })
                        .then((paintingValue) => {
                            if (paintingValue.owner != userPublicKey) {
                                throw new Error(
                                    "you don't own this painting to sell it.",
                                );
                            }
                            return bC98State.acceptOffer(paintingKey, buyerKey);
                        });
                };

                const makeOfferable = (paintingKey) => {
                    return bC98State
                        .getMessage(paintingKey, "Painting")
                        .catch((err) => {
                            const message = err.message || err;
                            logger.error(
                                `makeOfferable in blockchain is not responding: ${message}`,
                            );
                            throw new Error(
                                `makeOfferable in blockchain is not responding: ${err}`,
                            );
                        })
                        .then((paintingValue) => {
                            if (paintingValue.owner != userPublicKey) {
                                throw new Error(
                                    "you don't own this painting to sell it.",
                                );
                            }
                            return bC98State.makeOfferable(paintingKey);
                        });
                };

                let actionPromise;

                switch (action) {
                    case "CreateAccountAction":
                        if (!update && !update.createaccount) {
                            logger.error(
                                'update does not have "createaccount" field!',
                            );
                            throw new Error(
                                'update does not have "createaccount" field!',
                            );
                        }
                        let label = update.createaccount.label;
                        actionPromise = createAccount(label, userPublicKey);
                        break;

                    case "ChargeAccountAction":
                        if (!update && !update.chargeAccount) {
                            logger.error(
                                'update does not have "chargeaccount" field!',
                            );
                            throw new Error(
                                'update does not have "chargeaccount" field!',
                            );
                        }
                        let amount = update.chargeaccount.amount;

                        actionPromise = chargeAccount(amount, userPublicKey);
                        break;

                    case "CreatePaintingAction":
                        if (!update && !update.createpainting) {
                            logger.error(
                                'update does not have "createpainting" field!',
                            );
                            throw new Error(
                                'update does not have "createpainting" field!',
                            );
                        }

                        let key = update.createpainting.gene;

                        actionPromise = createPainting(key);
                        break;

                    case "CreateOfferAction":
                        if (!update && !update.createoffer) {
                            logger.error(
                                'update does not have "createoffer" field!',
                            );
                            throw new Error(
                                'update does not have "createoffer" field!',
                            );
                        }

                        actionPromise = createOffer(
                            update.createoffer.price,
                            update.createoffer.gene,
                            update.createoffer.buyerKey,
                        );
                        break;

                    case "AcceptOfferAction":
                        if (!update && !update.acceptoffer) {
                            logger.error(
                                'update does not have "acceptoffer" field!',
                            );
                            throw new Error(
                                'update does not have "acceptoffer" field!',
                            );
                        }

                        actionPromise = acceptOffer(
                            update.acceptoffer.gene,
                            update.acceptoffer.buyerKey,
                        );
                        break;

                    case "MakeOfferableAction":
                        if (!update && !update.makeofferable) {
                            logger.error(
                                'update does not have "makeofferable" field!',
                            );
                            throw new Error(
                                'update does not have "makeofferable" field!',
                            );
                        }

                        actionPromise = makeOfferable(
                            update.makeofferable.gene,
                        );
                        break;

                    default:
                        throw new Error(
                            `Action must be create or take not ${action}`,
                        );
                }
                // Get the current state, for the key's address

                return (
                    actionPromise
                        // .catch((err) => {
                        //     let message = err.message ? err.message : err
                        //     throw console.log(`the functions in PolyGameHandler are not working!: ${message}` )
                        // })
                        .then((addresses) => {
                            if (addresses.length === 0) {
                                throw new Error("State Error!");
                            }
                        })
                );
            })
            .catch((err) => {
                const message = err.message ? err.message : err;
                logger.error("Something bad happend! " + message);
                throw new InvalidTransaction(message);
            });
    }
}

module.exports = Blockchain98Handler;

/*
PGPayload {
	action: 'CreatePaintingAction',
	createPainting: CreatePaintingAction {
	  gene: [ 0.10000000149011612, 0.20000000298023224, 0.30000001192092896 ]
	}
  }
  info: Creating Painting 0.10000000149011612,0.20000000298023224,0.30000001192092896 for 03aa17ef54d47c9a2fd096d0fa781c550fbe8c791affe2a1a02b4dd879eefb553a {"service":"user-service","timestamp":"2020-06-13T20:03:07.984Z"}
  */
