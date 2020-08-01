import React from "react";
import { useRouteMatch } from "react-router-dom";
import { Navbar, Nav, Dropdown, Icon } from "rsuite";
// import Header from '../components/Header/header';

const Layout = ({ children }) => {
    const match = useRouteMatch();
    console.log(match);

    return (
        <div style={{ direction: "rtl" }}>
            {!["/", "/login", "register"].includes(match.path) && (
                <Navbar appearance="inverse">
                    <Navbar.Body>
                        <Nav>
                            <Nav.Item
                                icon={<Icon icon="home" />}
                                href="/dashboard"
                            >
                                داشبورد
                            </Nav.Item>
                            <Nav.Item
                                icon={<Icon icon="paint-brush" />}
                                href="createPainting"
                            >
                                نقاشی جدید
                            </Nav.Item>
                            <Nav.Item
                                icon={<Icon icon="image" />}
                                href="/gallery"
                            >
                                آثار
                            </Nav.Item>
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
            )}
            {children}
        </div>
    );
};

export default Layout;
