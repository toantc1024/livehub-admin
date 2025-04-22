import React, { useState, useEffect } from 'react';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Modal, Space } from 'antd';

const LocalizedModal = ({ title, okText, cancelText, content }) => {
    const [open, setOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Determine responsive width based on screen size
    const getModalWidth = () => {
        if (windowWidth < 480) {
            return '95%';
        } else if (windowWidth < 768) {
            return '80%';
        } else if (windowWidth < 1200) {
            return '70%';
        } else {
            return '50%';
        }
    };

    const showModal = () => {
        setOpen(true);
    };

    const hideModal = () => {
        setOpen(false);
    };

    return (
        <>
            <Modal
                title={title}
                open={open}
                onOk={hideModal}
                onCancel={hideModal}
                okText={okText}
                cancelText={cancelText}
                width={getModalWidth()}
                centered
                bodyStyle={{ maxHeight: windowWidth < 768 ? '70vh' : '60vh', overflow: 'auto' }}
            >
                {content}
            </Modal>
        </>
    );
};
