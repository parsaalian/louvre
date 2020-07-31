const {
    createOffer,
    submit,
} = require("../components/transactions/transactions");

export default function userCreateOffer({ privateKey, gene, price, buyerKey }) {
    let txn = createOffer(gene, price, buyerKey, privateKey);
    txn = Buffer.from(txn).toString("base64");
    const request = submit({ txn }, true).then((response) => response.data);
    return {
        type: "USER_MAKE_OFFER",
        payload: request,
    };
}
