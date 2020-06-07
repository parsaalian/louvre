import React, { Component } from 'react';
import { connect } from 'react-redux'
import  userChangePassword  from '../../actions/userChangePassword'


class NewPassword extends Component {

    state = {
        password:'',
        newPassword:''
    }

    handleInputPassword = (event) => {
        this.setState({password:event.target.value})
    }
    handleInputNewPassword = (event) => {
        this.setState({newPassword:event.target.value})
    }

    submitForm = (e) => {
        e.preventDefault();
        this.props.dispatch(userChangePassword({
            password:this.state.password,
            newPassword:this.state.newPassword
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
                        گذرواژه دلخواه را وارد نمایید
                    </h2>
                    <div className="form_element">
                    <input 
                        type="password"
                        placeholder="گذرواژه فعلی را وارد نمایید"
                        value={this.state.password}
                        onChange={(event)=>this.handleInputPassword(event)}
                    />
                    </div>
                    <div className="form_element">
                    <input 
                        type="password"
                        placeholder=" گذرواژه جدید را وارد نمایید"
                        value={this.state.newPassword}
                        onChange={(event)=>this.handleInputNewPassword(event)}
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
        user:state.user
    }
}

export default connect(mapStateToProps)(NewPassword)