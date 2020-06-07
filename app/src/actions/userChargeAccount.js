const { chargeAccount, submit } = require('../components/transactions/transactions') 

export default function userChargeAccount(doc){

  let transaction = chargeAccount(doc.privKey,doc.balance)
  transaction = Buffer.from(transaction).toString("base64");
  const request = submit({ txn: transaction }, true)
  .then((response) => response.data)
  return {
      type:'USER_CHARGE_ACCOUNT',
      payload:request
  }
}