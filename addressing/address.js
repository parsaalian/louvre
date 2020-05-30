const crypto = require ('crypto')

const hash = (x) => crypto.createHash('sha512').update(x).digest('hex').toLowerCase().substring(0,64)



const NAMESPACE = '59b423'


const createAccountAddress = (accountId) => {
    return NAMESPACE + 'ac' + hash(accountId).substr(0,60) + 'ac'
}


module.exports = {
    createAccountAddress,
} 

