const crypto = require("crypto");

const hash = (x) =>
    crypto
        .createHash("sha512")
        .update(x)
        .digest("hex")
        .toLowerCase()
        .substring(0, 64);

const NAMESPACE = "59b423";

const createAccountAddress = (accountId) =>
    NAMESPACE + "ac" + hash(accountId).substr(0, 60) + "ac";

const createOfferAddress = (paintingKey, buyerKey) =>
    NAMESPACE + "af" + hash(paintingKey + buyerKey).substr(0, 60) + "af";

const createPaintingAddress = (paintKey) =>
    NAMESPACE + "ba" + hash(JSON.stringify(paintKey)).substr(0, 60) + "ba";

module.exports = {
    createAccountAddress,
    createOfferAddress,
    createPaintingAddress,
};
