const {
    changeForSale,
    submit,
} = require("../components/transactions/transactions");

export default function userChangeForSale({ privateKey, paintingKey }) {
    let txn = changeForSale(paintingKey, privateKey);
    txn = Buffer.from(txn).toString("base64");
    const request = submit({ txn }, true).then((response) => response.data);
    return {
        type: "USER_MAKE_OFFERABLE",
        payload: request,
    };
}
