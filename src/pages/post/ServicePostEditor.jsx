import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Space, message, Checkbox, Spin, Card, Row, Col, Image, Typography, Divider, Modal } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router';
import RichtextEditor from '../../components/RichtextEditor';
import Dropzone from '../../components/Dropzone';
import { getServiceById, updateServiceById } from '../../services/item.service';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ServicePostEditor = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [service, setService] = useState(null);
    const [messageApi, contextHolder] = message.useMessage();
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [currentImages, setCurrentImages] = useState([]);

    useEffect(() => {
        const loadService = async () => {
            setLoading(true);
            try {
                let { data, error } = await getServiceById(id);
                if (error || !data || data.length === 0) {
                    messageApi.error('Lỗi khi lấy dữ liệu dịch vụ');
                    setLoading(false);
                    return;
                }

                const serviceData = data[0];
                setService(serviceData);
                setCurrentImages(serviceData.image_urls || []);

                form.setFieldsValue({
                    post_content: serviceData.post_content || '',
                    image_urls: serviceData.image_urls || [],
                    is_public: serviceData.is_public ?? true
                });
            } catch (error) {
                messageApi.error('Lỗi khi tải dữ liệu: ' + error.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadService();
        }
    }, [id, form, messageApi]);

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const updatedService = {
                ...service,
                post_content: values.post_content,
                image_urls: values.image_urls,
                is_public: values.is_public,
                status: service.status === 'pending' ? 'approved' : service.status
            };

            const { error } = await updateServiceById(id, updatedService);
            if (error) throw error;

            messageApi.success('Bài đăng đã được ' + (values.is_public ? 'hiển thị công khai' : 'ẩn khỏi trang chính'));

            if (service.status === 'pending') {
                messageApi.success('Dịch vụ đã được xác minh thành công');
            }

            // Navigate back after successful update
            setTimeout(() => {
                navigate(`/manage-service/${id}`);
            }, 1000);

        } catch (error) {
            messageApi.error('Lỗi khi cập nhật bài đăng: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate(`/manage-service/${id}`);
    };

    const handleImageChange = (newImages) => {
        setCurrentImages(newImages);
        form.setFieldsValue({ image_urls: newImages });
    };

    const handleRemoveImage = (imageUrl) => {
        Modal.confirm({
            title: 'Xác nhận xóa ảnh',
            icon: <ExclamationCircleOutlined />,
            content: 'Bạn có chắc chắn muốn xóa ảnh này?',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk() {
                const newImages = currentImages.filter(url => url !== imageUrl);
                setCurrentImages(newImages);
                form.setFieldsValue({ image_urls: newImages });
                message.success('Đã xóa ảnh');
            }
        });
    };

    const handlePreview = (imageUrl) => {
        setPreviewImage(imageUrl);
        setPreviewVisible(true);
    };

    return (
        <>
            {contextHolder}
            <Card title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        type="link"
                        icon={<ArrowLeftOutlined />}
                        onClick={handleCancel}
                        style={{ marginRight: '8px', padding: 0 }}
                    >
                        Quay lại
                    </Button>
                    <span>{service?.post_content ? "Sửa bài đăng" : "Tạo bài đăng"}</span>
                </div>
            }>
                {loading && !service ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        initialValues={{
                            post_content: service?.post_content || '',
                            image_urls: service?.image_urls || [],
                            is_public: service?.is_public ?? true
                        }}
                    >
                        <Form.Item
                            label="Nội dung bài đăng"
                            name="post_content"
                            valuePropName="markdown"
                            rules={[{ required: true, message: 'Vui lòng nhập nội dung bài đăng' }]}
                        >
                            <RichtextEditor />
                        </Form.Item>

                        <Divider orientation="left">Quản lý hình ảnh</Divider>

                        {/* Current Image Gallery
                        {currentImages.length > 0 && (
                            <div style={{ marginBottom: 24 }}>
                                <Title level={5}>Hình ảnh hiện tại</Title>
                                <Row gutter={[16, 16]}>
                                    {currentImages.map((url, index) => (
                                        <Col xs={24} sm={12} md={8} lg={6} key={index}>
                                            <div
                                                style={{
                                                    border: '1px solid #f0f0f0',
                                                    borderRadius: '4px',
                                                    padding: '8px',
                                                    position: 'relative'
                                                }}
                                            >
                                                <Image
                                                    src={url}
                                                    alt={`Image ${index + 1}`}
                                                    style={{
                                                        width: '100%',
                                                        height: '150px',
                                                        objectFit: 'cover',
                                                    }}
                                                    preview={false}
                                                />
                                                <div
                                                    style={{
                                                        marginTop: 8,
                                                        display: 'flex',
                                                        justifyContent: 'space-between'
                                                    }}
                                                >
                                                    <Button
                                                        size="small"
                                                        icon={<EyeOutlined />}
                                                        onClick={() => handlePreview(url)}
                                                    >
                                                        Xem
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => handleRemoveImage(url)}
                                                    >
                                                        Xóa
                                                    </Button>
                                                </div>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        )} */}

                        <Form.Item label="Thêm hình ảnh mới" name="image_urls">
                            <Dropzone
                                maxFiles={5}
                                bucket="images"
                                value={currentImages}
                                onChange={handleImageChange}
                            />
                        </Form.Item>
                        <Text type="secondary">Tải lên tối đa 5 hình ảnh. Hình ảnh nên rõ nét và hiển thị đầy đủ sản phẩm/dịch vụ.</Text>

                        <Form.Item
                            name="is_public"
                            valuePropName="checked"
                            style={{ marginTop: 24 }}
                        >
                            <Checkbox>Hiển thị bài đăng công khai</Checkbox>
                        </Form.Item>

                        <Form.Item>
                            <Space size="middle">
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    {service?.post_content ? "Cập nhật" : "Tạo"}
                                </Button>
                                <Button htmlType="button" onClick={handleCancel}>
                                    Hủy
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                )}
            </Card>

            {/* Image Preview Modal */}
            <Image
                width={0}
                style={{ display: 'none' }}
                src={previewImage}
                preview={{
                    visible: previewVisible,
                    src: previewImage,
                    onVisibleChange: (visible) => setPreviewVisible(visible),
                }}
            />
        </>
    );
};

export default ServicePostEditor;