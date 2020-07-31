import React from "react";
import { Switch, Route } from "react-router-dom";
import Home from "./components/Home/home";
import User from "./components/Admin";
import Layout from "./hoc/layout";
import AuthenticationCheck from "./hoc/auth";
import Login from "./containers/admin/login";
import Logout from "./components/Admin/logout";
import ChargeAccount from "./components/transactions/chargeAccount";
import CreatePainting from "./components/transactions/createPainting";
import Register from "./containers/admin/register";
import ChangePassword from "./components/Admin/changePassword";
import Paint from "./components/Paint";

const Routes = () => {
    return (
        <Layout>
            <Switch>
                <Route
                    path="/"
                    exact
                    component={AuthenticationCheck(Home, null)}
                />
                <Route
                    path="/login"
                    exact
                    component={AuthenticationCheck(Login, false)}
                />
                <Route
                    path="/logout"
                    exact
                    component={AuthenticationCheck(Logout, true)}
                />
                <Route path="/register" exact component={Register} />
                <Route
                    path="/changePassword"
                    exact
                    component={AuthenticationCheck(ChangePassword, true)}
                />

                <Route
                    path="/dashboard"
                    exact
                    component={AuthenticationCheck(User, true)}
                />
                <Route
                    path="/chargeAccount"
                    exact
                    component={AuthenticationCheck(ChargeAccount, true)}
                />
                <Route
                    path="/createPainting"
                    exact
                    component={AuthenticationCheck(CreatePainting, true)}
                />
                <Route
                    path="/painting/:id"
                    exact
                    component={AuthenticationCheck(Paint, true)}
                />
            </Switch>
        </Layout>
    );
};

export default Routes;
