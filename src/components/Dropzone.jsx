import React, { useState, useEffect } from 'react';
import { Upload, message, Image, Modal, Button } from 'antd';
import { InboxOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { uploadFile } from '../services/file_upload.service';

const { Dragger } = Upload;

const Dropzone = ({ value = [], onChange, onUploadComplete, maxFiles = 5, bucket = 'images' }) => {
    const [fileUrls, setFileUrls] = useState(value);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [fileToRemove, setFileToRemove] = useState(null);
    const [removePromiseResolve, setRemovePromiseResolve] = useState(null);

    useEffect(() => {
        setFileUrls(value);
    }, [value]);

    // Vietnamese translations
    const vnTranslations = {
        uploadText: 'Nhấp hoặc kéo hình ảnh vào khu vực này để tải lên',
        uploadHint: 'Hỗ trợ tải lên đơn lẻ hoặc hàng loạt.',
        imageType: 'không phải là tệp hình ảnh',
        sizeLimit: 'Hình ảnh phải nhỏ hơn 2MB!',
        uploadFailed: 'tải lên thất bại.',
        uploadSuccess: 'tải lên thành công.',
        confirmRemove: 'Bạn có chắc chắn muốn xóa ảnh này?'
    };

    const handlePreview = (file) => {
        if (file.url) {
            setPreviewImage(file.url);
            setPreviewVisible(true);
        }
    };

    const handleRemove = (file) => {
        return new Promise((resolve) => {
            setFileToRemove(file);
            setRemovePromiseResolve(() => resolve);
            setConfirmModalVisible(true);
        });
    };

    const confirmRemove = () => {
        const newList = fileUrls.filter(u => u !== fileToRemove.url);
        setFileUrls(newList);
        if (onChange) onChange(newList);
        if (removePromiseResolve) removePromiseResolve(true);
        setConfirmModalVisible(false);
    };

    const cancelRemove = () => {
        if (removePromiseResolve) removePromiseResolve(false);
        setConfirmModalVisible(false);
    };

    const props = {
        name: 'file',
        multiple: true,
        maxCount: maxFiles,
        fileList: fileUrls.map((url, idx) => ({
            uid: idx,
            name: url.split('/').pop(),
            status: 'done',
            url,
            thumbUrl: url // Hiển thị ảnh thu nhỏ
        })),
        onPreview: handlePreview, // Thêm xử lý xem trước ảnh
        onRemove: handleRemove,
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
                // Thay thế alert bằng message.info
                message.success(`${file.name} ${vnTranslations.uploadSuccess}`);
            } catch (error) {
                onError(error);
                message.error(`${file.name} ${vnTranslations.uploadFailed}`);
            }
        },
        listType: 'picture', // Hiển thị dạng ảnh thay vì chỉ hiện tên file
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

            {/* Preview image with modal */}
            <Image
                width={0}
                style={{ display: 'none' }}
                preview={{
                    visible: previewVisible,
                    src: previewImage,
                    onVisibleChange: (visible) => setPreviewVisible(visible),
                }}
            />

            {/* Confirmation modal for file removal */}
            <Modal
                title={vnTranslations.confirmRemove}
                open={confirmModalVisible}
                onOk={confirmRemove}
                onCancel={cancelRemove}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
            >
                <p><ExclamationCircleOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                    Ảnh sẽ bị xóa khỏi danh sách</p>
            </Modal>
        </div>
    );
};

export default Dropzone;
