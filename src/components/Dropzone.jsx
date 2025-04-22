import React, { useState, useEffect } from 'react';
import { Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { uploadFile } from '../services/file_upload.service';

const { Dragger } = Upload;

const Dropzone = ({ value = [], onChange, onUploadComplete, maxFiles = 5, bucket = 'images' }) => {
    const [fileUrls, setFileUrls] = useState(value);

    useEffect(() => {
        setFileUrls(value);
    }, [value]);

    // Vietnamese translations
    const vnTranslations = {
        uploadText: 'Nhấp hoặc kéo hình ảnh vào khu vực này để tải lên',
        uploadHint: 'Hỗ trợ tải lên đơn lẻ hoặc hàng loạt.',
        imageType: 'không phải là tệp hình ảnh',
        sizeLimit: 'Hình ảnh phải nhỏ hơn 2MB!',
        uploadFailed: 'tải lên thất bại.'
    };

    const props = {
        name: 'file',
        multiple: true,
        maxCount: maxFiles,
        fileList: fileUrls.map((url, idx) => ({ uid: idx, name: url.split('/').pop(), status: 'done', url })),
        onRemove: (file) => {
            const newList = fileUrls.filter(u => u !== file.url);
            setFileUrls(newList);
            if (onChange) onChange(newList);
        },
        beforeUpload: async (file) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error(`${file.name} ${vnTranslations.imageType}`);
                return Upload.LIST_IGNORE;
            }
            const isLt2M = file.size / 1024 / 1024 < 2;
            if (!isLt2M) {
                message.error(vnTranslations.sizeLimit);
                return Upload.LIST_IGNORE;
            }
            return true;
        },
        customRequest: async ({ file, onSuccess, onError }) => {
            try {
                const url = await uploadFile(file, bucket);
                onSuccess({ url });
                const newList = [...fileUrls, url];
                setFileUrls(newList);
                if (onChange) onChange(newList);
                if (onUploadComplete) {
                    onUploadComplete(url);
                }
            } catch (error) {
                onError(error);
                message.error(`${file.name} ${vnTranslations.uploadFailed}`);
            }
        },
    };

    // Responsive styles
    const responsiveStyles = {
        dropzoneContainer: {
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden'
        },
        uploadText: {
            fontSize: '16px',
            '@media (max-width: 768px)': {
                fontSize: '14px',
            },
            '@media (max-width: 480px)': {
                fontSize: '12px',
            }
        },
        uploadHint: {
            padding: '0 8px',
            '@media (max-width: 480px)': {
                display: 'none'
            }
        }
    };

    return (
        <div style={responsiveStyles.dropzoneContainer}>
            <Dragger {...props}>
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text" style={responsiveStyles.uploadText}>
                    {vnTranslations.uploadText}
                </p>
                <p className="ant-upload-hint" style={responsiveStyles.uploadHint}>
                    {vnTranslations.uploadHint}
                </p>
            </Dragger>
        </div>
    );
};

export default Dropzone;
