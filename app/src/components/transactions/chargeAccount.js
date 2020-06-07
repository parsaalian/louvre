import React, { Component } from 'react';
import { connect } from 'react-redux'
//import { Link } from 'react-router-dom'
import  userChargeAccount  from '../../actions/userChargeAccount'


class ChargeAccount extends Component {

    state = {
        balance:'',
        privKey:''
    }

    handleInputBalance = (event) => {
        this.setState({balance:event.target.value})
    }
    handleInputPrivKey = (event) => {
        this.setState({privKey:event.target.value})
    }

    submitForm = (e) => {
        e.preventDefault();
        this.props.dispatch(userChargeAccount({
            balance:this.state.balance,
            privKey:this.state.privKey
        }))
    }

    componentWillReceiveProps(){
            this.props.history.push('/dashboard')
    }

    render() {
        return (
            <div className="rl_container coin">
                <form onSubmit={this.submitForm} >
                    <h2>
                        مقدار دلخواه را وارد نمایید
                    </h2>
                    <div className="form_element">
                    <input 
                        type="text"
                        placeholder="مقدار را وارد نمایید"
                        value={this.state.balance}
                        onChange={(event)=>this.handleInputBalance(event)}
                    />
                    </div>
                    <div className="form_element">
                    <input 
                        type="password"
                        placeholder=" کلید خصوصی خود را وارد نمایید"
                        value={this.state.privKey}
                        onChange={(event)=>this.handleInputPrivKey(event)}
                    />
                    </div>

                    <button type="submit"> ارسال  </button>
                </form>
                
            </div>
        );
    }
}



function  mapStateToProps(state) {
    return {
        balance:state.balance,
        privKey:state.privKey
    }
}

export default connect(mapStateToProps)(ChargeAccount)