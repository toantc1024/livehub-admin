import React, { useState, useEffect } from 'react';
import { CurrencyFormat } from '../utils/Currency'
import RichtextEditor from '../components/RichtextEditor';
import { useParams } from 'react-router';
import { Divider, Button, Flex, Tabs, Form, Input, InputNumber, Select, Spin, Modal, Space, message, Image, Descriptions, Tag, Calendar, Checkbox } from 'antd';
import { ArrowLeftOutlined, EditOutlined, EyeOutlined, FileTextOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import TableData from '../components/TableData';
import { getDemandById, updateDemandById } from '../services/item.service';
import Dropzone from '../components/Dropzone';
import { getAllDemandApplicationsByDemandId, getAllDemandApplicationsByDemandIdCSV, updateDemandApplicationById } from '../services/demand_application.service';
import useAuthStore from '../stores/auth.store';
import supabase from '../supabase/client';
import SpinOverlay from '../components/SpinOverlay';

const WEEKDAYS = [
    { label: 'Monday', value: 'mon' },
    { label: 'Tuesday', value: 'tue' },
    { label: 'Wednesday', value: 'wed' },
    { label: 'Thursday', value: 'thu' },
    { label: 'Friday', value: 'fri' },
    { label: 'Saturday', value: 'sat' },
    { label: 'Sunday', value: 'sun' },
];

const STATUS_OPTIONS = [
    { label: 'Chờ duyệt', value: 'pending' },
    { label: 'Đã duyệt', value: 'approved' },
    { label: 'Từ chối', value: 'rejected' }
];

const DemandDetail = () => {
    const navigate = useNavigate();
    const [messageApi, contextHolder] = message.useMessage();
    const [loading, setLoading] = useState(false);
    const [dataSource, setDataSource] = useState([]);
    const { id } = useParams();
    const [demand, setDemand] = useState(null);
    const [form] = Form.useForm();
    const [editMode, setEditMode] = useState(false);
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [platformOptions, setPlatformOptions] = useState(['phone', 'email', 'facebook']);
    const [newPlatform, setNewPlatform] = useState('');
    const [demandList, setDemandList] = useState([]);
    const [demandLoading, setRentalLoading] = useState(false);
    const [selectedDemand, setSelectedDemand] = useState(null);
    const [demandDetailModal, setDemandApplicationDetailModal] = useState(false);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    // State for editable calendar in demand modal
    const [editableSlots, setEditableSlots] = useState([]);
    const user = useAuthStore(state => state.user);
    useEffect(() => {

        if (selectedDemand && selectedDemand.selected_time_slots?.slots) {

            setEditableSlots(selectedDemand.selected_time_slots.slots.map(s => s.split('T')[0]));
        } else {
            setEditableSlots([]);
        }
    }, [selectedDemand]);

    useEffect(() => {
        setLoading(true);
        setDataSource(Array.from({ length: 100 }).map((_, i) => ({
            key: i,
            name: `Edward King ${i}`,
        })));
        setLoading(false);
    }, [id]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                let { data, error } = await getDemandById(id);
                if (error || !data || data.length == 0) {
                    messageApi.error('Lỗi khi lấy dữ liệu');
                    setLoading(false);
                    return;
                }
                data = data[0];
                setDemand(data);

                form.setFieldsValue({
                    title: data.title,
                    description: data.description,
                    min: data.price_range?.min,
                    max: data.price_range?.max,
                    category: data.category,
                    note: data.note,
                    status: data.status,
                    contacts: data.contact_info?.contacts || [],
                });
            } catch (error) {
                messageApi.error('Lỗi khi tải dữ liệu: ' + error.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [id, form, messageApi]);

    // Fetch demand_demand list
    useEffect(() => {
        if (!id) return;
        setRentalLoading(true);
        getAllDemandApplicationsByDemandId(id)
            .then(data => setDemandList(data || []))
            .catch(() => setDemandList([]))
            .finally(() => setRentalLoading(false));
    }, [id]);

    const handleEdit = () => {
        setEditMode(true);
        messageApi.info('Đang chỉnh sửa dịch vụ');
    };

    const handleCancel = () => {
        setEditMode(false);
        form.setFieldsValue({
            title: demand.title,
            description: demand.description,
            min: demand.price_range?.min,
            max: demand.price_range?.max,
            days: demand.date_range?.days,
            category: demand.category,
            note: demand.note,
            status: demand.status,
            contacts: demand.contact_info?.contacts || [],
        });
        messageApi.info('Đã hủy thay đổi');
    };

    const handleUpdate = async (values) => {
        try {
            setLoading(true);
            const updatedDemand = {
                ...demand,
                title: values.title,
                description: values.description,
                price_range: {
                    min: values.min,
                    max: values.max,
                    currency: "VND"
                },
                date_range: {
                    days: values.days,
                    type: "week_days"
                },
                category: values.category,
                note: values.note,
                status: values.status,
                contact_info: {
                    contacts: values.contacts || []
                }
            };

            const { error } = await updateDemandById(id, updatedDemand);

            if (error) throw error;

            setDemand(updatedDemand);
            setEditMode(false);
            messageApi.success('Cập nhật dịch vụ thành công');

            if (values.status === 'approved' && demand.status !== 'approved') {
                messageApi.success('Dịch vụ đã được xác minh thành công');
            }
        } catch (error) {
            messageApi.error('Lỗi khi cập nhật dịch vụ: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = () => {
        setPreviewModalVisible(true);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    const handleCreatePost = () => {
        navigate(`/manage-demand/${id}/post`);
    };

    const handleApprove = async () => {
        setConfirmModalVisible(true);
    };

    const handleAddPlatform = () => {
        if (newPlatform && !platformOptions.includes(newPlatform)) {
            setPlatformOptions([...platformOptions, newPlatform]);
            setNewPlatform('');
        }
    };

    const handleExportRentals = async () => {
        try {
            const csvData = await getAllDemandApplicationsByDemandIdCSV(id);
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `demand_${id}_demands.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            message.error('Lỗi khi xuất CSV thuê dịch vụ: ' + err.message);
        }
    };

    const demandColumns = [
        {
            title: 'Ghi chú',
            dataIndex: 'note',
        },
        {
            title: 'Khoảng giá mong muốn',
            dataIndex: 'expect_price_range',
            render: (val) => val ? `${CurrencyFormat(val.min)} - ${CurrencyFormat(val.max)}` : '',
        },
        {
            title: 'Tên người đăng',
            dataIndex: 'name',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            render: (status) => {
                let color = 'red';
                let text = 'Chưa duyệt';
                if (status === 'approved') {
                    color = 'green';
                    text = 'Đã duyệt';
                } else if (status === 'pending') {
                    color = 'orange';
                    text = 'Chờ duyệt';
                }
                return <Tag color={color}>{text}</Tag>;
            }
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Button size="small" onClick={async () => {
                    setSelectedDemand(record);
                    let newSelectedDemand = { ...record };
                    try {
                        const { data, error } = await supabase.auth.admin.getUserById(record.supplier_id);
                        if (error) throw error;
                        newSelectedDemand.user = data.user;
                        setSelectedDemand(newSelectedDemand);
                    } catch (error) {
                        message.error('Lỗi khi lấy thông tin người dùng: ' + error.message);
                    }
                    setDemandApplicationDetailModal(true);
                }}>Xem chi tiết</Button>
            ),
        },
    ];

    return (
        <>
            {contextHolder}
            <div>
                <Flex justify='space-between'>
                    <Button type='link' onClick={() => {
                        navigate('/manage-demand', { replace: false });
                    }}>
                        <ArrowLeftOutlined />
                        Quay lại
                    </Button>
                </Flex>
                <SpinOverlay loading={loading} fullPage={true}>
                    {demand ? (
                        <Tabs type="card">
                            <Tabs.TabPane tab='Thông tin dịch vụ' key='1'>
                                <Divider>
                                    <Space style={{ marginLeft: 16 }}>
                                        {!editMode ? (
                                            <>
                                                <Button
                                                    type="default"
                                                    icon={<EditOutlined />}
                                                    onClick={handleEdit}
                                                    disabled={loading}
                                                >
                                                    Cập nhật thông tin
                                                </Button>
                                                <Button
                                                    type="dashed"
                                                    icon={<EyeOutlined />}
                                                    onClick={handlePreview}
                                                >
                                                    Xem trước
                                                </Button>
                                                {demand.status === 'approved' ? (
                                                    demand.post_content ? (
                                                        <Button
                                                            type="primary"
                                                            icon={<FileTextOutlined />}
                                                            onClick={handleCreatePost}
                                                        >
                                                            Sửa bài đăng
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            type="primary"
                                                            icon={<FileTextOutlined />}
                                                            onClick={handleCreatePost}
                                                        >
                                                            Tạo bài đăng
                                                        </Button>
                                                    )
                                                ) : (
                                                    <Button
                                                        type="primary"
                                                        onClick={handleApprove}
                                                    >
                                                        Duyệt
                                                    </Button>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    type="primary"
                                                    onClick={form.submit}
                                                    loading={loading}
                                                >
                                                    Lưu
                                                </Button>
                                                <Button
                                                    onClick={handleCancel}
                                                    disabled={loading}
                                                >
                                                    Hủy
                                                </Button>
                                            </>
                                        )}
                                    </Space>
                                </Divider>
                                <Form
                                    form={form}
                                    layout="vertical"
                                    initialValues={form.getFieldsValue()}
                                    disabled={!editMode || loading}
                                    onFinish={handleUpdate}
                                >
                                    <Form.Item label="Tiêu đề" name="title" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                    <Form.Item label="Mô tả" name="description">
                                        <Input.TextArea rows={3} />
                                    </Form.Item>
                                    <Form.Item label="Khoảng giá tối thiểu" name="min" rules={[{ required: true }]}>
                                        <InputNumber min={0} style={{ width: '100%' }} addonAfter="VND" />
                                    </Form.Item>
                                    <Form.Item label="Khoảng giá tối đa" name="max" rules={[{ required: true }]}>
                                        <InputNumber min={0} style={{ width: '100%' }} addonAfter="VND" />
                                    </Form.Item>
                                    <Form.Item label="Ngày cho thuê trong tuần" name="days">
                                        <Select mode="multiple" options={WEEKDAYS} placeholder="Chọn ngày" />
                                    </Form.Item>
                                    <Form.Item label="Danh mục" name="category">
                                        <Input />
                                    </Form.Item>
                                    <Form.Item label="Ghi chú" name="note">
                                        <Input.TextArea rows={1} />
                                    </Form.Item>
                                    <Form.Item
                                        label="Trạng thái"
                                        name="status"
                                        rules={[{ required: true }]}
                                    >
                                        <Select options={STATUS_OPTIONS} />
                                    </Form.Item>
                                    <Form.List name="contacts">
                                        {(fields, { add, remove }) => (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {fields.map(field => (
                                                    <div
                                                        key={field.key}
                                                        style={{
                                                            display: 'flex',
                                                            flexWrap: 'wrap',
                                                            gap: 8,
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <Form.Item
                                                            {...field}
                                                            name={[field.name, 'platform']}
                                                            fieldKey={[field.fieldKey, 'platform']}
                                                            rules={[{ required: true, message: 'Chọn nền tảng' }]}
                                                            style={{ flex: '1 1 120px', minWidth: 120, marginBottom: 0 }}
                                                        >
                                                            <Select
                                                                placeholder="Nền tảng"
                                                                showSearch
                                                                showArrow
                                                                optionFilterProp="children"
                                                                dropdownRender={menu => (
                                                                    <>
                                                                        {menu}
                                                                        <div style={{ display: 'flex', gap: 8, padding: 8 }}>
                                                                            <Input
                                                                                placeholder="Thêm nền tảng mới"
                                                                                size="small"
                                                                                value={newPlatform}
                                                                                onChange={e => setNewPlatform(e.target.value)}
                                                                                onKeyDown={e => {
                                                                                    if (e.key === 'Enter' && newPlatform) {
                                                                                        handleAddPlatform();
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <Button size="small" type="link" onClick={handleAddPlatform} disabled={!newPlatform}>
                                                                                Thêm
                                                                            </Button>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            >
                                                                {platformOptions.map(opt => (
                                                                    <Select.Option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</Select.Option>
                                                                ))}
                                                            </Select>
                                                        </Form.Item>
                                                        <Form.Item
                                                            {...field}
                                                            name={[field.name, 'value']}
                                                            fieldKey={[field.fieldKey, 'value']}
                                                            rules={[{ required: true, message: 'Nhập thông tin liên hệ' }]}
                                                            style={{ flex: '2 1 200px', minWidth: 180, marginBottom: 0 }}
                                                        >
                                                            <Input placeholder="Thông tin liên hệ" />
                                                        </Form.Item>
                                                        <MinusCircleOutlined onClick={() => remove(field.name)} style={{ color: '#ff4d4f', fontSize: 18, cursor: 'pointer' }} />
                                                    </div>
                                                ))}
                                                <Form.Item style={{ marginBottom: 0 }}>
                                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                        Thêm liên hệ
                                                    </Button>
                                                </Form.Item>
                                            </div>
                                        )}
                                    </Form.List>
                                </Form>


                            </Tabs.TabPane>
                            <Tabs.TabPane tab='Danh sách người ứng tuyển' key='2'>
                                {/* Export CSV demands */}
                                <div style={{ marginBottom: 16 }}>
                                    <Button type="primary" icon={<FileTextOutlined />} onClick={handleExportRentals}>
                                        Xuất CSV
                                    </Button>
                                </div>
                                <TableData
                                    columns={demandColumns}
                                    dataSource={demandList}
                                    loading={demandLoading}
                                    handleTableChange={() => { }}
                                    pageSize={50}
                                    searchable={true}
                                    searchField="name"
                                />
                            </Tabs.TabPane>
                        </Tabs>
                    ) : <Spin />}
                </SpinOverlay>
            </div>

            <Modal
                title="Xem trước"
                open={previewModalVisible}
                onCancel={() => setPreviewModalVisible(false)}
                footer={[
                    <Button key="cancel" htmlType="button" onClick={() => setPreviewModalVisible(false)}>
                        Hủy
                    </Button>
                ]}
                width={800}
            >
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Tên gói">{demand?.title}</Descriptions.Item>
                    <Descriptions.Item label="Mô tả">{demand?.description}</Descriptions.Item>
                    <Descriptions.Item label="Giá">{demand && formatCurrency(demand.price_range?.min)} - {demand && formatCurrency(demand.price_range?.max)}</Descriptions.Item>
                    <Descriptions.Item label="Ngày cho thuê">{demand?.date_range?.days?.map(d => d.toUpperCase()).join(', ')}</Descriptions.Item>
                    <Descriptions.Item label="Danh mục"><Tag>{demand?.category}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Ghi chú">{demand?.note}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái"><Tag color={demand?.status === 'approved' ? 'green' : demand?.status === 'pending' ? 'orange' : 'red'}>{demand?.status}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Liên hệ">
                        {demand?.contact_info?.contacts?.map((c, idx) => (
                            <div key={idx}>{c.platform}: {c.value}</div>
                        ))}
                    </Descriptions.Item>
                    <Descriptions.Item label="Nội dung bài đăng">
                        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{demand?.post_content}</pre>
                    </Descriptions.Item>
                    <Descriptions.Item label="Hình ảnh">
                        <Image.PreviewGroup>
                            {demand?.image_urls?.map(url => (
                                <Image key={url} src={url} style={{ maxWidth: 200, margin: 8 }} />
                            ))}
                        </Image.PreviewGroup>
                    </Descriptions.Item>
                </Descriptions>
            </Modal>

            {/* Rental Detail Modal */}
            <Modal
                title="Chi tiết yêu ứng tuyển"
                open={demandDetailModal}
                onCancel={() => setDemandApplicationDetailModal(false)}
                footer={selectedDemand && selectedDemand.status !== 'approved' ? [
                    <Button key="approve" type="primary" onClick={async () => {
                        setRentalLoading(true);
                        await updateDemandApplicationById(selectedDemand.id, { status: 'approved' });
                        setDemandList(list => list.map(r => r.id === selectedDemand.id ? { ...r, status: 'approved' } : r));
                        setDemandApplicationDetailModal(false);
                        setRentalLoading(false);
                        message.success('Đã duyệt yêu ứng tuyển');
                    }}>Duyệt</Button>,
                    <Button key="close" onClick={() => setDemandApplicationDetailModal(false)}>Đóng</Button>
                ] : [<Button key="close" onClick={() => setDemandApplicationDetailModal(false)}>Đóng</Button>]}
            >
                {selectedDemand && (
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Tên nhà cung cấp">{selectedDemand?.user?.user_metadata?.fullName}</Descriptions.Item>
                        <Descriptions.Item label="Ghi chú">{selectedDemand.note}</Descriptions.Item>
                        <Descriptions.Item label="Liên hệ">
                            {selectedDemand?.contact_info?.contacts?.map((c, idx) => (
                                <div key={idx}>{c.platform}: {c.value}</div>
                            ))}
                        </Descriptions.Item>

                        <Descriptions.Item label="Chương trình khuyến mãi">
                            {selectedDemand?.promote_text ? selectedDemand.promote_text : 'Không có'}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal >

            {/* Custom Confirm Modal */}
            < Modal
                title="Xác nhận duyệt nhu cầu"
                open={confirmModalVisible}
                onCancel={() => setConfirmModalVisible(false)}
                footer={
                    [
                        <Button key="cancel" onClick={() => setConfirmModalVisible(false)}>
                            Hủy
                        </Button>,
                        <Button
                            key="confirm"
                            type="primary"
                            onClick={async () => {
                                setConfirmModalVisible(false);
                                setLoading(true);
                                const updatedDemand = {
                                    ...demand,
                                    status: 'approved',
                                };
                                const { error } = await updateDemandById(id, updatedDemand);
                                if (error) {
                                    messageApi.error('Lỗi khi duyệt dịch vụ: ' + error.message);
                                    setLoading(false);
                                    return;
                                }
                                setDemand(updatedDemand);
                                messageApi.success('Duyệt dịch vụ thành công');
                                // Navigate to post editor after approval
                                setTimeout(() => {
                                    navigate(`/manage-demand/${id}/post`);
                                }, 1000);
                            }}
                        >
                            Đồng ý
                        </Button>
                    ]}
            >
                <p>Bạn có chắc chắn muốn duyệt nhu cầu này?</p>
                <p>Việc duyệt sẽ cho phép bạn tạo bài đăng.</p>
            </Modal >
        </>
    );
};

export default DemandDetail;
