import axios from "axios";

export default function userRegisterBlockchain(info) {
  const request = axios.post("/blockchain/registerBlockchain", info)
  return dispatch => {
    request.then(({ data }) => {
        
      let users = data.user;
      let response = {
        success: data.success,
        users
      };
      dispatch({
        type: "USERS_REGISTER_BLOCKCHAIN",
        payload: response
      });
    });
  };
}
