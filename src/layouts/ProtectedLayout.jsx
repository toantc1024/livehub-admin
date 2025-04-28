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
    MenuUnfoldOutlined,
    MenuFoldOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Layout, Menu, theme, ConfigProvider, Button } from 'antd';
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
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    scrollbarWidth: 'thin',
    scrollbarGutter: 'stable',
    backgroundColor: '#fff',
    boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
    zIndex: 100,
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
    const [isMobile, setIsMobile] = useState(false);
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const clearUser = useAuthStore((state) => state.clearUser);

    // Check if screen size is mobile
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth <= 768) {
                setCollapsed(true);
            }
        };

        // Initial check
        checkIsMobile();

        // Add event listener for window resize
        window.addEventListener('resize', checkIsMobile);

        // Cleanup
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

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

    const toggleSider = () => {
        setCollapsed(!collapsed);
    };

    return (
        <ConfigProvider theme={customTheme}>
            <Layout style={{ minHeight: '100vh' }}>
                <Sider
                    style={{
                        ...siderStyle,
                        display: isMobile && collapsed ? 'none' : 'block',
                    }}
                    theme="light"
                    collapsed={collapsed}
                    collapsible
                    breakpoint="lg"
                    onCollapse={value => setCollapsed(value)}>
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
                            if (isMobile) {
                                setCollapsed(true);
                            }
                        }}
                        theme="light"
                        selectedKeys={selectedKeys}
                        mode="inline"
                        items={items}
                    />
                </Sider>
                <Layout style={{ marginLeft: isMobile ? 0 : (collapsed ? 80 : 200), transition: 'margin-left 0.2s' }}>
                    <div
                        style={{
                            padding: isMobile ? '8px 16px' : '12px 24px',
                            background: '#fff',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            justifyContent: 'space-between',
                            alignItems: isMobile ? 'flex-start' : 'center',
                            gap: isMobile ? '8px' : 0,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {isMobile && (
                                <Button
                                    type="text"
                                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                                    onClick={toggleSider}
                                    style={{ marginRight: 16, fontSize: 16 }}
                                />
                            )}
                            <h2 style={{ margin: 0, color: '#f5770b', fontSize: isMobile ? '18px' : '24px' }}>Hệ thống quản trị</h2>
                        </div>
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
                                padding: isMobile ? 16 : 24,
                                background: '#ffffff',
                                margin: isMobile ? 12 : 24,
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
                        borderTop: '1px solid #ffd8a8',
                        padding: isMobile ? '12px' : '24px'
                    }}>
                        LiveHub ©{new Date().getFullYear()} - MARG
                    </Footer>
                </Layout>
            </Layout>
        </ConfigProvider>
    );
};
export default App;