import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router';

const ErrorPage = ({
    status = '404',
    title = 'Oops, trang này không tồn tại',
    subTitle = 'Bạn có thể quay lại trang Dashboard để tiếp tục sử dụng ứng dụng',
}) => {
    const navigate = useNavigate();

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    return (
        <div className="error-page-container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#f0f2f5'
        }}>
            <Result
                status={status}
                title={title}
                subTitle={subTitle}
                extra={
                    <Button type="primary" onClick={handleBackToDashboard}>
                        Trở lại trang chính
                    </Button>
                }
            />
        </div>
    );
};

export default ErrorPage;