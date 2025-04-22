import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Space, message, Checkbox, Spin, Card } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router';
import RichtextEditor from '../../components/RichtextEditor';
import Dropzone from '../../components/Dropzone';
import { getDemandById, updateDemandById } from '../../services/item.service';

const DemandPostEditor = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [demand, setDemand] = useState(null);
    const [messageApi, contextHolder] = message.useMessage();

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

            messageApi.success('Bài đăng đã được tạo thành công');

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
        </>
    );
};

export default DemandPostEditor;