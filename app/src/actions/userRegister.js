import axios from "axios";
// const {
//   createAccount,
//   submit
// } = require("../components/transactions/transactions");

export default function userRegister(user) {
  // const transaction = createAccount(user.privKey)
  // submit(transaction, true);

  const request = axios.post("/auth/register", user);
  return dispatch => {
    request.then(({ data }) => {
      let users = data.user;
      let response = {
        success: data.success,
        users
      };
      dispatch({
        type: "USERS_REGISTER",
        payload: response
      });
    });
  };
}
