import React, { useState } from 'react';
import { loginWithEmailAndPassword, registerWithEmailAndPassword } from '../services/auth.service';
import { Button, Checkbox, Form, Input, message, Spin, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import useAuthStore from '../stores/auth.store';
import { useNavigate } from 'react-router';
import LogoImage from '../assets/LOGO.png';

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const setUser = useAuthStore((state) => state.setUser);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        try {
            setLoading(true);
            const { user } = await loginWithEmailAndPassword(
                values.email,
                values.password
            );
            setUser(user);
            message.success('Đăng nhập thành công!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Login failed:', error);
            message.error(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
        message.error('Vui lòng kiểm tra lại thông tin đăng nhập.');
    };

    return (
        <div
            className="login-outer-container"
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f5770b 0%, #d45e00 100%)',
                backgroundAttachment: "fixed",
                backgroundSize: "cover",
                padding: 16,
                position: 'relative',
            }}
        >
            {loading && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(255,255,255,0.6)',
                        backdropFilter: 'blur(5px)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Spin size="large" tip="Đang xử lý..." />
                </div>
            )}
            <div
                className="login-container"
                style={{
                    width: '100%',
                    maxWidth: 420,
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '40px 32px',
                    boxShadow: '0 10px 30px rgba(212, 94, 0, 0.2)',
                    borderRadius: 20,
                    margin: '0 auto',
                    transition: 'all 0.3s ease',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                    <img src={LogoImage} alt="LiveHub Logo" style={{ height: 80, marginBottom: 10 }} />
                </div>

                <h1 style={{
                    textAlign: 'center',
                    marginBottom: 30,
                    fontWeight: 700,
                    fontSize: 28,
                    color: '#f5770b',
                    // background: 'linear-gradient(to right, #f5770b, #d45e00)',
                    // WebkitBackgroundClip: 'text',
                    // WebkitTextFillColor: 'transparent',
                }}>
                    Đăng nhập LiveHub
                </h1>

                <Divider style={{ margin: '16px 0 24px' }}>
                    <span style={{ color: '#666', fontSize: 14 }}>Quản trị viên</span>
                </Divider>

                <Form
                    name="login"
                    layout="vertical"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                    size="large"
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Vui lòng nhập email hợp lệ!' },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: '#f5770b' }} />}
                            placeholder="Email đăng nhập"
                            style={{ borderRadius: 8, height: 50 }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#f5770b' }} />}
                            placeholder="Mật khẩu"
                            style={{ borderRadius: 8, height: 50 }}
                        />
                    </Form.Item>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Form.Item name="remember" valuePropName="checked" style={{ margin: 0 }}>
                            <Checkbox>Ghi nhớ tài khoản</Checkbox>
                        </Form.Item>
                        <a href="#" style={{ color: '#f5770b' }}>Quên mật khẩu?</a>
                    </div>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            size="large"
                            style={{
                                height: 50,
                                borderRadius: 8,
                                background: 'linear-gradient(to right, #f5770b, #d45e00)',
                                border: 'none',
                                fontWeight: 600,
                                fontSize: 16
                            }}
                        >
                            Đăng nhập
                        </Button>
                    </Form.Item>
                </Form>
                <div style={{ textAlign: 'center', marginTop: 16, color: '#666' }}>
                    © {new Date().getFullYear()} LiveHub Admin - All Rights Reserved
                </div>
            </div>
        </div>
    );
};

export default LoginPage;