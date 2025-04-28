import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Space, message, Checkbox, Spin, Card, Row, Col, Image, Typography, Divider, Modal } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, EyeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router';
import RichtextEditor from '../../components/RichtextEditor';
import Dropzone from '../../components/Dropzone';
import { getDemandById, updateDemandById } from '../../services/item.service';

const { Title, Text } = Typography;

const DemandPostEditor = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [demand, setDemand] = useState(null);
    const [messageApi, contextHolder] = message.useMessage();
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [currentImages, setCurrentImages] = useState([]);

    useEffect(() => {
        const loadDemand = async () => {
            setLoading(true);
            try {
                let { data, error } = await getDemandById(id);
                if (error || !data || data.length === 0) {
                    messageApi.error('Lỗi khi lấy dữ liệu nhu cầu');
                    setLoading(false);
                    return;
                }

                const demandData = data[0];
                setDemand(demandData);
                setCurrentImages(demandData.image_urls || []);

                form.setFieldsValue({
                    post_content: demandData.post_content || '',
                    image_urls: demandData.image_urls || [],
                    is_public: demandData.is_public ?? true
                });
            } catch (error) {
                messageApi.error('Lỗi khi tải dữ liệu: ' + error.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadDemand();
        }
    }, [id, form, messageApi]);

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const updatedDemand = {
                ...demand,
                post_content: values.post_content,
                image_urls: values.image_urls,
                is_public: values.is_public,
                status: demand.status === 'pending' ? 'approved' : demand.status
            };

            const { error } = await updateDemandById(id, updatedDemand);
            if (error) throw error;

            messageApi.success('Bài đăng đã được ' + (values.is_public ? 'hiển thị công khai' : 'ẩn khỏi trang chính'));

            if (demand.status === 'pending') {
                messageApi.success('Nhu cầu đã được xác minh thành công');
            }

            // Navigate back after successful update
            setTimeout(() => {
                navigate(`/manage-demand/${id}`);
            }, 1000);

        } catch (error) {
            messageApi.error('Lỗi khi cập nhật bài đăng: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate(`/manage-demand/${id}`);
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
                    <span>{demand?.post_content ? "Sửa bài đăng" : "Tạo bài đăng"}</span>
                </div>
            }>
                {loading && !demand ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        initialValues={{
                            post_content: demand?.post_content || '',
                            image_urls: demand?.image_urls || [],
                            is_public: demand?.is_public ?? true
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
                                    {demand?.post_content ? "Cập nhật" : "Tạo"}
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

export default DemandPostEditor;