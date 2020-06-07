import axios from 'axios'


export default function userChangePassword({password, newPassword}){
    const request = axios.post('/api/changePassword',{ password: password, newPassword: newPassword })
    .then(response => response.data)
    return {
        type:'USER_CHANGE_PASSWORD',
        payload:request
    }
}