import axios from 'axios'


export default function loginUser({email, password}){
    const request = axios({
        method: 'post',
        withCredentials: true,
        url: '/auth/login',
        data: { email, password }
    })
    .then(response => response.data)
    return {
        type:'USER_LOGIN',
        payload:request
    }
}