import React from "react";
import { Button } from "rsuite";

const Home = (props) => {
    return (
        <div className="logout_container" style={{ textAlign: "center" }}>
            <h1>به بازی لورر خوش آمدید</h1>
            <a href="login" style={{ margin: "1rem" }}>
                <Button appearance="primary">ورود</Button>
            </a>
            <a href="register" style={{ margin: "1rem" }}>
                <Button appearance="primary">ثبت‌نام</Button>
            </a>
        </div>
    );
};

export default Home;
