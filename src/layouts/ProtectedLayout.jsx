import React, { useEffect, useState } from 'react';
import LOGO from '../assets/LOGO.png';
import { Outlet, useNavigate, useLocation } from 'react-router';
import {
    DesktopOutlined,
    FileOutlined,
    PieChartOutlined,
    TeamOutlined,
    UserOutlined,
    LogoutOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Layout, Menu, theme, ConfigProvider } from 'antd';
import useAuthStore from '../stores/auth.store';
const { Header, Content, Footer, Sider } = Layout;
function getItem(label, key, icon, children) {
    return {
        key,
        icon,
        children,
        label,
    };
}
const items = [
    getItem('Tổng quan', 'dashboard', <PieChartOutlined />),
    getItem('Quản lý dịch vụ', 'manage-service', <DesktopOutlined />),
    getItem('Quản lý nhu cầu', 'manage-demand', <DesktopOutlined />),
    getItem('Đăng xuất', 'logout', <LogoutOutlined />),
];

const siderStyle = {
    overflow: 'auto',
    height: '100vh',
    position: 'sticky',
    insetInlineStart: 0,
    top: 0,
    bottom: 0,
    scrollbarWidth: 'thin',
    scrollbarGutter: 'stable',
    backgroundColor: '#fff',
    boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
};

// Custom theme
const customTheme = {
    token: {
        colorPrimary: '#f5770b',
        colorLinkHover: '#d45e00',
        colorLink: '#f5770b',
        colorPrimaryBg: '#fff9f0',
        colorBgContainer: '#ffffff',
    },
};

const App = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const clearUser = useAuthStore((state) => state.clearUser);
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user]);
    const currentPath = useLocation();
    const [selectedKeys, setSelectedKeys] = useState([]);
    useEffect(() => {
        setSelectedKeys(currentPath.pathname.split('/').filter(Boolean));
    }, [currentPath]);
    return (
        <ConfigProvider theme={customTheme}>
            <Layout style={{ minHeight: '100vh' }}>
                <Sider
                    style={siderStyle}
                    theme="light"
                    collapsed={collapsed} onCollapse={value => setCollapsed(value)}>
                    <div
                        style={{
                            padding: '24px 0',
                            textAlign: 'center',
                            marginBottom: 1
                        }}
                    >
                        <img src={LOGO} alt="logo" style={{ width: collapsed ? 40 : 80, margin: '0 auto' }} />
                    </div>
                    <Menu
                        onSelect={(item) => {
                            if (item.key === 'logout') {
                                clearUser();
                                navigate('/login');
                            }
                            else {
                                // For all other items, navigate to the corresponding page
                                navigate(item.key);
                            }
                            setSelectedKeys([item.key]);
                        }}
                        theme="light"
                        selectedKeys={selectedKeys}
                        mode="inline"
                        items={items}
                    />
                </Sider>
                <Layout>
                    <div
                        style={{
                            padding: '12px 24px',
                            background: '#fff',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <h2 style={{ margin: 0, color: '#f5770b' }}>LiveHub Administration</h2>
                        {user && (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <UserOutlined style={{ color: '#f5770b', fontSize: 16, marginRight: 8 }} />
                                <span>{user.email}</span>
                            </div>
                        )}
                    </div>
                    <Content style={{ margin: '0', overflow: 'initial', background: '#fff9f0' }}>
                        <div
                            style={{
                                padding: 24,
                                background: '#ffffff',
                                margin: 24,
                                borderRadius: 8,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            }}
                        >
                            <Outlet />
                        </div>
                    </Content>
                    <Footer style={{
                        textAlign: 'center',
                        background: '#fff',
                        color: '#666',
                        borderTop: '1px solid #ffd8a8'
                    }}>
                        LiveHub ©{new Date().getFullYear()} - MARG
                    </Footer>
                </Layout>
            </Layout>
        </ConfigProvider>
    );
};
export default App;