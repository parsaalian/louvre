import React, { Component } from "react";
import { connect } from "react-redux";
import userRegister from "../../actions/userRegister";

class Register extends Component {
  state = {
    name:"",
    lastName: "",
    email: "",
    password: "",
    error: ""
  };

  handleInputName = event => {
    this.setState({ name: event.target.value })
  }
  handleInputLastName = event => {
    this.setState({ lastName: event.target.value })
  }
  handleInputEmail = event => {
    this.setState({ email: event.target.value });
  };
  handleInputPassword = event => {
    this.setState({ password: event.target.value });
  };

  componentWillReceiveProps(nextProps) {
    if (nextProps.user.register === false) {
      this.setState({ error: "خطا رخ داد، دوباره امتحان کنید" });
    } else if (nextProps.user.register === true) {
      this.setState({
        name: "",
        lastName: "",
        email: "",
        password: ""
      });

      this.props.history.push("/login");
    }
  }

  submitForm = e => {
    e.preventDefault();
    this.props.dispatch(
      userRegister({
        name: this.state.name,
        lastName: this.state.lastName,
        email: this.state.email,
        password: this.state.password
      })
    );
  };

  render() {
    return (
      <div className="rl_container">
        <form onSubmit={this.submitForm}>
          <h2>لطفا ثبت نام بفرمایید</h2>
          <div className="form_element">
            <input
              type="text"
              placeholder="نام خود را وارد نمایید"
              value={this.state.name}
              onChange={this.handleInputName}
            />
          </div>
          <div className="form_element">
            <input
              type="text"
              placeholder="نام خانوادگی خود را وارد نمایید"
              value={this.state.lastName}
              onChange={this.handleInputLastName}
            />
          </div>
          <div className="form_element">
            <input
              type="email"
              placeholder="ایمیل را وارد نمایید"
              value={this.state.email}
              onChange={this.handleInputEmail}
            />
          </div>
          <div className="form_element">
            <input
              type="password"
              placeholder="گذرواژه را وارد نمایید"
              value={this.state.password}
              onChange={this.handleInputPassword}
            />
          </div>

          <button type="submit"> ارسال </button>
          <div className="error">{this.state.error}</div>
        </form>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    user: state.user
  };
}

export default connect(mapStateToProps)(Register);
