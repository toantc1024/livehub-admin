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
    { label: 'Thứ Hai', value: 'mon' },
    { label: 'Thứ Ba', value: 'tue' },
    { label: 'Thứ Tư', value: 'wed' },
    { label: 'Thứ Năm', value: 'thu' },
    { label: 'Thứ Sáu', value: 'fri' },
    { label: 'Thứ Bảy', value: 'sat' },
    { label: 'Chủ Nhật', value: 'sun' },
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
    const [postConfirmModalVisible, setPostConfirmModalVisible] = useState(false);
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
            // Kiểm tra tiêu đề không được trống
            if (!values.title || values.title.trim() === '') {
                messageApi.error('Tiêu đề không được để trống');
                return;
            }

            // Kiểm tra giá tối thiểu không lớn hơn giá tối đa
            if (values.min > values.max) {
                messageApi.error('Giá tối thiểu không được lớn hơn giá tối đa');
                return;
            }

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
                },
                image_urls: values.image_urls || demand.image_urls
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

    const handleApprove = () => {
        message.info('Bạn sắp duyệt nhu cầu này. Vui lòng xác nhận!');
        setConfirmModalVisible(true);
    };

    const handleAddPlatform = () => {
        if (newPlatform && !platformOptions.includes(newPlatform)) {
            setPlatformOptions([...platformOptions, newPlatform]);
            setNewPlatform('');
        }
    };

    // Helper to parse contact info which might be string or object
    const parseContactInfo = (contactInfo) => {
        if (!contactInfo) return {};
        if (typeof contactInfo === 'string') {
            try {
                return JSON.parse(contactInfo);
            } catch {
                return {};
            }
        }
        return contactInfo;
    };

    const handleExportRentals = async () => {
        try {
            // Define Vietnamese headers
            const headers = [
                'Tên người ứng tuyển',
                'Tên nhu cầu ứng tuyển',
                'Email',
                'Địa chỉ',
                'Số điện thoại',
                'Chương trình khuyến mãi',
                'Trạng thái',
                'Ghi chú',
                'Ngày tạo'
            ];

            // Transform demandList data to CSV rows
            const csvRows = demandList.map(application => {
                const contactInfo = parseContactInfo(application.contact_info);

                const supplierName = application.supplier?.raw_user_meta_data?.fullName || 'Trống';
                const demandTitle = application.demand?.title || 'Trống';
                const email = contactInfo.email || application.supplier?.raw_user_meta_data?.email || 'Trống';
                const address = contactInfo.address || 'Trống';
                const phone = contactInfo.phone || 'Trống';

                let status = 'Chưa duyệt';
                if (application.status === 'approved') status = 'Đã duyệt';
                else if (application.status === 'pending') status = 'Chờ duyệt';
                else if (application.status === 'rejected') status = 'Từ chối';

                // Escape fields that might contain commas or quotes
                const escapeField = (field) => {
                    if (field === null || field === undefined) return 'Trống';
                    const str = String(field);
                    if (str.trim() === '') return 'Trống';
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                };

                return [
                    escapeField(supplierName),
                    escapeField(demandTitle),
                    escapeField(email),
                    escapeField(address),
                    escapeField(phone),
                    escapeField(application.promote_text),
                    escapeField(status),
                    escapeField(application.note),
                    escapeField(new Date(application.created_at).toLocaleDateString('vi-VN'))
                ].join(',');
            });

            // Combine headers and rows
            const csvContent = [headers.join(','), ...csvRows].join('\n');

            // Add UTF-8 BOM for proper Vietnamese character display
            const BOM = '\uFEFF';
            const csvWithBOM = BOM + csvContent;

            // Create and download the file
            const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ung_tuyen_nhu_cau_${id}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            messageApi.success('Xuất CSV thành công');
        } catch (err) {
            message.error('Lỗi khi xuất CSV ứng tuyển: ' + err.message);
        }
    };

    const demandColumns = [
        {
            title: 'Tên người ứng tuyển',
            dataIndex: 'supplier',
            render: (supplier) => supplier?.raw_user_meta_data?.fullName || 'Trống',
            width: 150,
        },
        {
            title: 'Tên nhu cầu',
            dataIndex: 'demand',
            render: (demand) => demand?.title || 'Trống',
            width: 150,
        },
        {
            title: 'Chương trình khuyến mãi',
            dataIndex: 'promote_text',
            ellipsis: true,
            width: 150,
        },
        {
            title: 'Ghi chú',
            dataIndex: 'note',
            ellipsis: true,
            width: 150,
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
            },
            width: 100,
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '',
            width: 100,
        },
        {
            title: 'Thao tác',
            key: 'action',
            fixed: 'right',
            width: 100,
            render: (_, record) => (
                <Button size="small" onClick={() => {
                    setSelectedDemand(record);
                    setDemandApplicationDetailModal(true);
                }}>Xem chi tiết</Button>
            ),
        },
    ];

    // Force re-render modal content when demand application status changes
    useEffect(() => {
        if (selectedDemand) {
            // Find the updated demand application from the list to ensure we have the latest data
            const updatedDemand = demandList.find(d => d.id === selectedDemand.id);
            if (updatedDemand) {
                setSelectedDemand(updatedDemand);
            }
        }
    }, [demandList, selectedDemand?.id]);

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
                                    <Space
                                        style={{
                                            marginLeft: 16,
                                            flexWrap: 'wrap',
                                            justifyContent: 'center'
                                        }}
                                        size={[8, 8]}
                                        wrap
                                    >
                                        {!editMode ? (
                                            <Flex
                                                wrap="wrap"
                                                gap="small"
                                                justify="center"
                                                style={{
                                                    width: '100%',
                                                    // Make buttons display in one row on laptop screens
                                                    '@media (min-width: 768px)': {
                                                        flexDirection: 'row',
                                                    },
                                                    // Make buttons stack on mobile screens
                                                    '@media (max-width: 767px)': {
                                                        flexDirection: 'column',
                                                    }
                                                }}
                                            >
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
                                            </Flex>
                                        ) : (
                                            <Flex
                                                wrap="wrap"
                                                gap="small"
                                                justify="center"
                                                style={{ width: '100%' }}
                                            >
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
                                            </Flex>
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
                                    <Form.Item label="Tiêu đề" name="title" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}>
                                        <Input />
                                    </Form.Item>
                                    <Form.Item label="Mô tả" name="description">
                                        <Input.TextArea rows={3} />
                                    </Form.Item>
                                    <Form.Item label="Khoảng giá tối thiểu" name="min" rules={[{ required: true, message: 'Vui lòng nhập giá tối thiểu' }]}>
                                        <InputNumber min={0} style={{ width: '100%' }} addonAfter="VND" />
                                    </Form.Item>
                                    <Form.Item label="Khoảng giá tối đa" name="max" rules={[{ required: true, message: 'Vui lòng nhập giá tối đa' }]}>
                                        <InputNumber min={0} style={{ width: '100%' }} addonAfter="VND" />
                                    </Form.Item>
                                    <Form.Item label="Ngày cho thuê trong tuần" name="days">
                                        <Select
                                            mode="multiple"
                                            options={WEEKDAYS}
                                            placeholder="Chọn ngày"
                                            value={demand?.date_range?.start ? [demand.date_range.start] : []}
                                        />
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
                                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                                    >
                                        <Select options={STATUS_OPTIONS} />
                                    </Form.Item>

                                    {/* Hiển thị hình ảnh */}
                                    <Form.Item label="Hình ảnh">
                                        {editMode ? (
                                            <Dropzone
                                                maxFiles={5}
                                                bucket="images"
                                                value={demand?.image_urls || []}
                                                onChange={(newImages) => {
                                                    const updatedDemand = { ...demand, image_urls: newImages };
                                                    setDemand(updatedDemand);
                                                    form.setFieldsValue({ image_urls: newImages });
                                                }}
                                            />
                                        ) : (
                                            demand?.image_urls?.length > 0 ? (
                                                <div className="image-slider" style={{ width: '100%', overflow: 'hidden' }}>
                                                    <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', padding: '10px 0' }}>
                                                        {demand.image_urls.map((url, index) => (
                                                            <div key={index} style={{ flex: '0 0 auto' }}>
                                                                <Image
                                                                    src={url}
                                                                    style={{ height: '150px', objectFit: 'cover' }}
                                                                    preview={{
                                                                        src: url,
                                                                        mask: <EyeOutlined style={{ fontSize: '16px' }} />,
                                                                    }}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span>Không có hình ảnh</span>
                                            )
                                        )}
                                    </Form.Item>

                                    <Form.Item name="image_urls" hidden={true}>
                                        <Input />
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
                                                {/* <Form.Item style={{ marginBottom: 0 }}>
                                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                        Thêm liên hệ
                                                    </Button>
                                                </Form.Item> */}
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
                                    searchField="note"
                                    scroll={{ x: 1000 }}
                                />
                            </Tabs.TabPane>
                        </Tabs>
                    ) : <Spin />}
                </SpinOverlay>
            </div >

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
                    <Descriptions.Item label="Hình ảnh">
                        {demand?.image_urls?.length > 0 ? (
                            <div className="image-slider" style={{ width: '100%', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', padding: '10px 0' }}>
                                    {demand.image_urls.map((url, index) => (
                                        <div key={index} style={{ flex: '0 0 auto' }}>
                                            <Image
                                                src={url}
                                                style={{ height: '150px', objectFit: 'cover' }}
                                                preview={{
                                                    src: url,
                                                    mask: <EyeOutlined style={{ fontSize: '16px' }} />,
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <span>Không có hình ảnh</span>
                        )}
                    </Descriptions.Item>
                </Descriptions>
            </Modal>

            {/* Rental Detail Modal */}
            <Modal
                title="Chi tiết hồ sơ ứng tuyển"
                open={demandDetailModal}
                onCancel={() => setDemandApplicationDetailModal(false)}
                footer={selectedDemand && selectedDemand.status !== 'approved' ? [
                    <Button key="approve" type="primary" onClick={async () => {
                        setRentalLoading(true);
                        await updateDemandApplicationById(selectedDemand.id, { status: 'approved' });
                        // Update both the list and the selected demand
                        const updatedDemand = { ...selectedDemand, status: 'approved' };
                        setSelectedDemand(updatedDemand);
                        setDemandList(list => list.map(r => r.id === selectedDemand.id ? updatedDemand : r));
                        setDemandApplicationDetailModal(false);
                        setRentalLoading(false);
                        message.success('Đã duyệt hồ sơ ứng tuyển');
                    }}>Duyệt</Button>,
                    <Button key="close" onClick={() => setDemandApplicationDetailModal(false)}>Đóng</Button>
                ] : [<Button key="close" onClick={() => setDemandApplicationDetailModal(false)}>Đóng</Button>]}
                width={1000}
            >
                {selectedDemand && (
                    <Descriptions
                        bordered
                        column={1}
                        size="small"
                        labelStyle={{ whiteSpace: 'nowrap' }}
                    >
                        <Descriptions.Item label="Tên người ứng tuyển">{selectedDemand.supplier?.raw_user_meta_data?.fullName}</Descriptions.Item>
                        <Descriptions.Item label="Tên nhu cầu">{selectedDemand.demand?.title}</Descriptions.Item>
                        <Descriptions.Item label="Ghi chú cho quản trị viên">{selectedDemand.note}</Descriptions.Item>
                        <Descriptions.Item label="Chương trình khuyến mãi">{selectedDemand.promote_text || 'Không có'}</Descriptions.Item>
                        <Descriptions.Item label="Thông tin liên hệ">
                            {(() => {
                                const contactInfo = parseContactInfo(selectedDemand.contact_info);
                                return (
                                    <div>
                                        {contactInfo.name && <div><strong>Tên:</strong> {contactInfo.name}</div>}
                                        {contactInfo.email && <div><strong>Email:</strong> {contactInfo.email}</div>}
                                        {contactInfo.phone && <div><strong>Số điện thoại:</strong> {contactInfo.phone}</div>}
                                        {contactInfo.address && <div><strong>Địa chỉ:</strong> {contactInfo.address}</div>}
                                        {selectedDemand.supplier?.raw_user_meta_data?.email && !contactInfo.email && <div><strong>Email đăng ký:</strong> {selectedDemand.supplier.raw_user_meta_data.email}</div>}
                                    </div>
                                );
                            })()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            {(() => {
                                let color = 'red';
                                let text = 'Chưa duyệt';
                                if (selectedDemand.status === 'approved') {
                                    color = 'green';
                                    text = 'Đã duyệt';
                                } else if (selectedDemand.status === 'pending') {
                                    color = 'orange';
                                    text = 'Chờ duyệt';
                                }
                                return <Tag color={color}>{text}</Tag>;
                            })()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Hình ảnh">
                            <Image.PreviewGroup>
                                {selectedDemand.image_urls?.map((url, idx) => (
                                    <Image key={idx} src={url} style={{ maxWidth: 200, margin: 8 }} />
                                ))}
                            </Image.PreviewGroup>
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal >

            {/* Custom Confirm Modal */}
            < Modal
                title="Xác nhận duyệt nhu cầu"
                open={confirmModalVisible}
                onCancel={() => setConfirmModalVisible(false)}
                footer={[
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

                            // Force UI update by refreshing the demand data
                            const { data } = await getDemandById(id);
                            if (data && data.length > 0) {
                                const refreshedDemand = data[0];
                                setDemand(refreshedDemand);

                                // Update form with fresh data
                                form.setFieldsValue({
                                    title: refreshedDemand.title,
                                    description: refreshedDemand.description,
                                    min: refreshedDemand.price_range?.min,
                                    max: refreshedDemand.price_range?.max,
                                    days: refreshedDemand.date_range?.days || [],
                                    category: refreshedDemand.category,
                                    note: refreshedDemand.note,
                                    status: refreshedDemand.status,
                                    contacts: refreshedDemand.contact_info?.contacts || [],
                                });
                            }

                            messageApi.success('Duyệt dịch vụ thành công');
                            setLoading(false);
                            setPostConfirmModalVisible(true);
                        }}
                    >
                        Đồng ý
                    </Button>
                ]}
            >
                <p>Bạn có chắc chắn muốn duyệt nhu cầu này?</p>
                <p>Việc duyệt sẽ cho phép bạn tạo bài đăng.</p>
            </Modal>
            <Modal
                title="Tạo bài đăng cho nhu cầu"
                open={postConfirmModalVisible}
                onCancel={() => setPostConfirmModalVisible(false)}
                footer={[
                    <Button key="no" onClick={() => setPostConfirmModalVisible(false)}>
                        Không
                    </Button>,
                    <Button key="yes" type="primary" onClick={() => {
                        setPostConfirmModalVisible(false);
                        navigate(`/manage-demand/${id}/post`);
                    }}>
                        Có
                    </Button>
                ]}
            >
                <p>Bạn có muốn tạo bài đăng cho nhu cầu này không?</p>
            </Modal>
        </>
    );
};

export default DemandDetail;
