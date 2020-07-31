import React from "react";
import { Navbar, Nav, Dropdown, Icon } from "rsuite";
// import Header from '../components/Header/header';

const Layout = ({ children }) => {
    return (
        <div style={{ direction: "rtl" }}>
            <Navbar appearance="inverse">
                <Navbar.Body>
                    <Nav>
                        <Nav.Item icon={<Icon icon="home" />} href="/dashboard">
                            داشبورد
                        </Nav.Item>
                        <Nav.Item
                            icon={<Icon icon="paint-brush" />}
                            href="createPainting"
                        >
                            نقاشی جدید
                        </Nav.Item>
                        <Nav.Item icon={<Icon icon="image" />}>آثار</Nav.Item>
                        <Nav.Item
                            icon={<Icon icon="money" />}
                            href="/chargeAccount"
                        >
                            شارژ حساب
                        </Nav.Item>
                    </Nav>
                    <Nav pullRight>
                        <Dropdown title="تنظیمات">
                            <Dropdown.Item
                                icon={<Icon icon="cog" />}
                                href="changePassword"
                            >
                                تغییر رمز
                            </Dropdown.Item>
                            <Dropdown.Item
                                icon={<Icon icon="sign-out" />}
                                href="/logout"
                            >
                                خروج
                            </Dropdown.Item>
                        </Dropdown>
                    </Nav>
                </Navbar.Body>
            </Navbar>
            {children}
        </div>
    );
};

export default Layout;
