import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Space, message, Checkbox, Spin, Card } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router';
import RichtextEditor from '../../components/RichtextEditor';
import Dropzone from '../../components/Dropzone';
import { getServiceById, updateServiceById } from '../../services/item.service';

const ServicePostEditor = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [service, setService] = useState(null);
    const [messageApi, contextHolder] = message.useMessage();

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

                        <Form.Item label="Hình ảnh" name="image_urls">
                            <Dropzone maxFiles={5} bucket="images" />
                        </Form.Item>

                        <Form.Item
                            name="is_public"
                            valuePropName="checked"
                        >
                            <Checkbox>Hiển thị bài đăng công khai</Checkbox>
                        </Form.Item>

                        <Form.Item>
                            <Space>
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
        </>
    );
};

export default ServicePostEditor;