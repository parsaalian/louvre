const {
    acceptOffer,
    submit,
} = require("../components/transactions/transactions");

export default function userAccepteOffer({ privateKey, gene, buyerKey }) {
    let txn = acceptOffer(gene, buyerKey, privateKey);
    txn = Buffer.from(txn).toString("base64");
    const request = submit({ txn }, true).then((response) => response.data);
    return {
        type: "USER_ACCEPT_OFFER",
        payload: request,
    };
}
