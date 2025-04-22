import React from 'react';
import { Spin } from 'antd';

/**
 * A reusable spinner overlay component for loading states
 * @param {boolean} loading - Whether the spinner should be displayed
 * @param {string} size - Size of the spinner ('small', 'default', 'large')
 * @param {string} tip - Text to display under the spinner
 * @param {React.ReactNode} children - Content to render when not loading
 * @returns {JSX.Element}
 */
const SpinOverlay = ({ loading = false, size = 'large', tip = 'Loading...', children, fullPage = false }) => {
    const spinnerStyle = fullPage
        ? {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100%'
        }
        : {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            width: '100%',
            minHeight: '200px'
        };

    if (loading) {
        return (
            <div style={spinnerStyle}>
                <Spin size={size} tip={tip} />
            </div>
        );
    }

    return children || null;
};

export default SpinOverlay;