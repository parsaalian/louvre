import React from 'react'
import axios from 'axios'

const Logout = (props) => {
    axios.get(`/auth/logout`)
        .then(() => {
            setTimeout(() => {
                props.history.push('/')
            },2000)
        })
    return (
        <div className="logout_container">
            <h1>
                خداحافظ
            </h1>
            
        </div>
    )
}

export default Logout