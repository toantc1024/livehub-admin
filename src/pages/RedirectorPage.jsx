import { Spin } from 'antd';
import React from 'react'
import { useNavigate } from 'react-router'

const RedirectorPage = ({ pathname = "dashboard" }) => {
    const navigate = useNavigate();
    React.useEffect(() => {
        navigate(`/${pathname}`)
    }, [pathname, navigate])
    return (
        <div className="flex justify-center items-center h-screen">
            <Spin size="large" tip="Redirecting..." />
        </div>
    )
}

export default RedirectorPage