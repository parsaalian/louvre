import React, { Component } from 'react';
import { Link } from 'react-router-dom'

class Header extends Component {



    render(){
        return (
            <header>
                    <Link to="/" className="logo">
                        بلاک چین ۹۸
                    </Link>
            </header>
        )
    }
}
export default Header;