import React, { useState, useEffect } from 'react';
import { CurrencyFormat } from '../utils/Currency'
import RichtextEditor from '../components/RichtextEditor';
import { useParams } from 'react-router';
import { Divider, Button, Flex, Tabs, Form, Input, InputNumber, Select, Spin, Modal, Space, message, Image, Descriptions, Tag, Calendar, Checkbox, Alert } from 'antd';
import { ArrowLeftOutlined, EditOutlined, EyeOutlined, FileTextOutlined, MinusCircleOutlined, PlusOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import TableData from '../components/TableData';
import { getServiceById, updateServiceById } from '../services/item.service';
import Dropzone from '../components/Dropzone';
import { getAllServiceRentalByServiceId, getAllServiceRentalByServiceIdCSV, updateServiceRentalById } from '../services/service_rental.service';

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

const ServiceDetail = () => {
    const navigate = useNavigate();
    const [messageApi, contextHolder] = message.useMessage();
    const [loading, setLoading] = useState(false);
    const [dataSource, setDataSource] = useState([]);
    const { id } = useParams();
    const [service, setService] = useState(null);
    const [form] = Form.useForm();
    const [editMode, setEditMode] = useState(false);
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [platformOptions, setPlatformOptions] = useState(['phone', 'email', 'facebook']);
    const [newPlatform, setNewPlatform] = useState('');
    const [rentalList, setRentalList] = useState([]);
    const [rentalLoading, setRentalLoading] = useState(false);
    const [selectedRental, setSelectedRental] = useState(null);
    const [rentalDetailModal, setRentalDetailModal] = useState(false);
    const [calendarModalVisible, setCalendarModalVisible] = useState(false);
    const [duplicateAlert, setDuplicateAlert] = useState(null);
    // State for editable calendar in rental modal
    const [editableSlots, setEditableSlots] = useState([]);
    useEffect(() => {
        if (selectedRental && selectedRental.selected_time_slots?.slots) {
            setEditableSlots(selectedRental.selected_time_slots.slots.map(s => s.split('T')[0]));
        } else {
            setEditableSlots([]);
        }
    }, [selectedRental]);

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
                let { data, error } = await getServiceById(id);
                if (error || !data || data.length == 0) {
                    messageApi.error('Lỗi khi lấy dữ liệu');
                    setLoading(false);
                    return;
                }
                data = data[0];
                setService(data);

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

    // Fetch service_rental list
    useEffect(() => {
        if (!id) return;
        setRentalLoading(true);
        getAllServiceRentalByServiceId(id)
            .then(data => {
                setRentalList(data || []);
                checkForDuplicateRentals(data);
            })
            .catch(() => setRentalList([]))
            .finally(() => setRentalLoading(false));
    }, [id]);

    const handleEdit = () => {
        setEditMode(true);
        messageApi.info('Đang chỉnh sửa dịch vụ');
    };

    // Function to check for duplicate/overlapping rental dates
    const checkForDuplicateRentals = (rentals) => {
        if (!rentals || rentals.length < 2) {
            setDuplicateAlert(null);
            return;
        }

        // Collect all date slots from all rentals
        const allDateSlots = {};
        let hasDuplicates = false;
        let duplicateDates = [];

        rentals.forEach(rental => {
            if (rental.selected_time_slots?.slots) {
                rental.selected_time_slots.slots.forEach(slot => {
                    const date = slot.split('T')[0]; // Extract just the date part
                    if (allDateSlots[date]) {
                        hasDuplicates = true;
                        duplicateDates.push(date);
                        allDateSlots[date].push(rental.id);
                    } else {
                        allDateSlots[date] = [rental.id];
                    }
                });
            }
        });

        if (hasDuplicates) {
            const uniqueDuplicateDates = [...new Set(duplicateDates)];
            setDuplicateAlert({
                message: 'Phát hiện trùng lịch đặt',
                description: `Có các ngày bị trùng lịch đặt: ${uniqueDuplicateDates.join(', ')}`,
                dates: uniqueDuplicateDates
            });
        } else {
            setDuplicateAlert(null);
        }
    };

    const handleCancel = () => {
        setEditMode(false);
        form.setFieldsValue({
            title: service.title,
            description: service.description,
            min: service.price_range?.min,
            max: service.price_range?.max,
            days: service.date_range?.days,
            category: service.category,
            note: service.note,
            status: service.status,
            contacts: service.contact_info?.contacts || [],
        });
        messageApi.info('Đã hủy thay đổi');
    };

    const handleUpdate = async (values) => {
        try {
            setLoading(true);
            const updatedService = {
                ...service,
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

            const { error } = await updateServiceById(id, updatedService);

            if (error) throw error;

            setService(updatedService);
            setEditMode(false);
            messageApi.success('Cập nhật dịch vụ thành công');

            if (values.status === 'approved' && service.status !== 'approved') {
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
        navigate(`/manage-service/${id}/post`);
    };

    const handleApprove = () => {
        Modal.confirm({
            title: 'Xác nhận duyệt dịch vụ',
            content: 'Bạn có chắc chắn muốn duyệt dịch vụ này?',
            onOk: async () => {
                try {
                    setLoading(true);
                    const updatedService = {
                        ...service,
                        status: 'approved'
                    };

                    const { error } = await updateServiceById(id, updatedService);
                    if (error) throw error;

                    setService(updatedService);
                    messageApi.success('Dịch vụ đã được duyệt thành công');

                    // Navigate to post editor after approval
                    setTimeout(() => {
                        navigate(`/manage-service/${id}/post`);
                    }, 1000);
                } catch (error) {
                    messageApi.error('Lỗi khi duyệt dịch vụ: ' + error.message);
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleAddPlatform = () => {
        if (newPlatform && !platformOptions.includes(newPlatform)) {
            setPlatformOptions([...platformOptions, newPlatform]);
            setNewPlatform('');
        }
    };

    const handleExportRentals = async () => {
        try {
            const csvData = await getAllServiceRentalByServiceIdCSV(id);
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `service_${id}_rentals.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            message.error('Lỗi khi xuất CSV thuê dịch vụ: ' + err.message);
        }
    };

    // Open calendar modal to view all service rentals
    const showCalendarModal = () => {
        setCalendarModalVisible(true);
    };

    // Calendar date cell renderer for the full calendar modal
    const calendarDateCellRender = (date) => {
        const dateStr = date.format('YYYY-MM-DD');
        const hasRental = rentalList.some(rental =>
            rental.selected_time_slots?.slots?.some(slot => slot.split('T')[0] === dateStr)
        );

        const isDuplicate = duplicateAlert?.dates?.includes(dateStr);

        if (hasRental) {
            return (
                <div style={{
                    background: isDuplicate ? '#ff4d4f' : '#1677ff',
                    color: '#fff',
                    borderRadius: 4,
                    padding: 2,
                    textAlign: 'center',
                    fontSize: '11px'
                }}>
                    {isDuplicate ? 'Trùng lịch' : 'Đã thuê'}
                </div>
            );
        }
        return null;
    };

    // Check for duplicates when viewing a specific rental
    const checkRentalForDuplicates = (rental) => {
        if (!rental || !rental.selected_time_slots?.slots || !rentalList || rentalList.length < 2) {
            return false;
        }

        const rentalDates = rental.selected_time_slots.slots.map(slot => slot.split('T')[0]);

        // Check if any other rental has the same dates
        const otherRentals = rentalList.filter(r => r.id !== rental.id);

        for (const date of rentalDates) {
            for (const otherRental of otherRentals) {
                if (otherRental.selected_time_slots?.slots?.some(slot => slot.split('T')[0] === date)) {
                    return true;
                }
            }
        }

        return false;
    };

    const rentalColumns = [
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
            title: 'Tên người thuê',
            dataIndex: 'name',
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button size="small" onClick={() => {
                        setSelectedRental(record);
                        setRentalDetailModal(true);
                    }}>
                        Xem chi tiết
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <>
            {contextHolder}
            <div>
                <Flex justify='space-between'>
                    <Button type='link' onClick={() => {
                        navigate('/manage-service', { replace: false });
                    }}>
                        <ArrowLeftOutlined />
                        Quay lại
                    </Button>
                </Flex>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                        <Spin size="large" />
                    </div>
                ) : service ? (
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
                                            {service.status === 'approved' ? (
                                                service.post_content ? (
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
                                    <Select 
                                        mode="multiple" 
                                        options={WEEKDAYS} 
                                        placeholder="Chọn ngày"
                                        value={service?.date_range?.start ? [service.date_range.start] : []}
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
                        <Tabs.TabPane tab='Danh sách người thuê' key='2'>
                            {/* Alert for duplicate rentals */}
                            {duplicateAlert && (
                                <Alert
                                    message={duplicateAlert.message}
                                    description={duplicateAlert.description}
                                    type="error"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />
                            )}

                            {/* Export CSV rentals and view calendar */}
                            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                                <Button type="primary" icon={<FileTextOutlined />} onClick={handleExportRentals}>
                                    Xuất CSV
                                </Button>
                                <Button icon={<CalendarOutlined />} onClick={showCalendarModal}>
                                    Xem lịch tổng hợp
                                </Button>
                            </div>
                            <TableData
                                columns={rentalColumns}
                                dataSource={rentalList}
                                loading={rentalLoading}
                                handleTableChange={() => { }}
                                pageSize={50}
                                searchable={true}
                                searchField="name"
                            />
                        </Tabs.TabPane>
                    </Tabs>
                ) : <Spin />}
            </div>

            {/* Preview Modal */}
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
                    <Descriptions.Item label="Tên gói">{service?.title}</Descriptions.Item>
                    <Descriptions.Item label="Mô tả">{service?.description}</Descriptions.Item>
                    <Descriptions.Item label="Giá">{service && formatCurrency(service.price_range?.min)} - {service && formatCurrency(service.price_range?.max)}</Descriptions.Item>
                    <Descriptions.Item label="Ngày cho thuê">{service?.date_range?.days?.map(d => d.toUpperCase()).join(', ')}</Descriptions.Item>
                    <Descriptions.Item label="Danh mục"><Tag>{service?.category}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Ghi chú">{service?.note}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái"><Tag color={service?.status === 'approved' ? 'green' : service?.status === 'pending' ? 'orange' : 'red'}>{service?.status}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Liên hệ">
                        {service?.contact_info?.contacts?.map((c, idx) => (
                            <div key={idx}>{c.platform}: {c.value}</div>
                        ))}
                    </Descriptions.Item>
                    <Descriptions.Item label="Nội dung bài đăng">
                        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{service?.post_content}</pre>
                    </Descriptions.Item>
                    <Descriptions.Item label="Hình ảnh">
                        <Image.PreviewGroup>
                            {service?.image_urls?.map(url => (
                                <Image key={url} src={url} style={{ maxWidth: 200, margin: 8 }} />
                            ))}
                        </Image.PreviewGroup>
                    </Descriptions.Item>
                </Descriptions>
            </Modal>

            {/* Rental Detail Modal */}
            <Modal
                title="Chi tiết yêu cầu thuê"
                open={rentalDetailModal}
                onCancel={() => setRentalDetailModal(false)}
                footer={selectedRental && selectedRental.status !== 'approved' ? [
                    <Button key="approve" type="primary" onClick={async () => {
                        // Check for duplicates before approving
                        const hasDuplicates = checkRentalForDuplicates(selectedRental);

                        if (hasDuplicates) {
                            Modal.confirm({
                                title: 'Cảnh báo trùng lịch',
                                content: 'Yêu cầu thuê này có các ngày trùng với yêu cầu khác. Bạn vẫn muốn duyệt?',
                                okText: 'Duyệt',
                                cancelText: 'Hủy',
                                okButtonProps: { danger: true },
                                onOk: async () => {
                                    setRentalLoading(true);
                                    await updateServiceRentalById(selectedRental.id, { status: 'approved' });
                                    setRentalList(list => list.map(r => r.id === selectedRental.id ? { ...r, status: 'approved' } : r));
                                    setRentalDetailModal(false);
                                    setRentalLoading(false);
                                    message.success('Đã duyệt yêu cầu thuê');
                                }
                            });
                        } else {
                            setRentalLoading(true);
                            await updateServiceRentalById(selectedRental.id, { status: 'approved' });
                            setRentalList(list => list.map(r => r.id === selectedRental.id ? { ...r, status: 'approved' } : r));
                            setRentalDetailModal(false);
                            setRentalLoading(false);
                            message.success('Đã duyệt yêu cầu thuê');
                        }
                    }}>Duyệt</Button>,
                    <Button key="close" onClick={() => setRentalDetailModal(false)}>Đóng</Button>
                ] : [<Button key="close" onClick={() => setRentalDetailModal(false)}>Đóng</Button>]}
            >
                {selectedRental && (
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Ghi chú">{selectedRental.note}</Descriptions.Item>
                        <Descriptions.Item label="Liên hệ">
                            {service?.contact_info?.contacts?.map((c, idx) => (
                                <div key={idx}>{c.platform}: {c.value}</div>
                            ))}
                        </Descriptions.Item>
                        <Descriptions.Item label="Khoảng giá mong muốn">
                            {CurrencyFormat(selectedRental?.expect_price_range?.min)} - {CurrencyFormat(selectedRental?.expect_price_range?.max)} </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            {(() => {
                                let color = 'red';
                                let text = 'Chưa duyệt';
                                if (selectedRental.status === 'approved') {
                                    color = 'green';
                                    text = 'Đã duyệt';
                                } else if (selectedRental.status === 'pending') {
                                    color = 'orange';
                                    text = 'Chờ duyệt';
                                }
                                return <Tag color={color}>{text}</Tag>;
                            })()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Khoảng thời gian đã chọn">
                            {checkRentalForDuplicates(selectedRental) && (
                                <Alert
                                    message="Phát hiện trùng lịch"
                                    description="Yêu cầu thuê này có các ngày trùng với yêu cầu khác."
                                    type="error"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />
                            )}
                            {selectedRental.selected_time_slots && (
                                <div>
                                    <Calendar
                                        fullscreen={false}
                                        value={null}
                                        dateCellRender={date => {
                                            const dateStr = date.format('YYYY-MM-DD');
                                            const isSelected = editableSlots.includes(dateStr);

                                            // Check if this date conflicts with other rentals
                                            const isDuplicate = isSelected && rentalList.some(rental =>
                                                rental.id !== selectedRental.id &&
                                                rental.selected_time_slots?.slots?.some(slot =>
                                                    slot.split('T')[0] === dateStr
                                                )
                                            );

                                            return isSelected ? (
                                                <div style={{
                                                    background: isDuplicate ? '#ff4d4f' : '#1677ff',
                                                    color: '#fff',
                                                    borderRadius: 4,
                                                    padding: 2,
                                                    textAlign: 'center'
                                                }}>
                                                    {isDuplicate ? 'Trùng lịch' : 'Chọn'}
                                                </div>
                                            ) : null;
                                        }}
                                    />
                                </div>
                            )}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>

            {/* Calendar Modal to show all service rentals */}
            <Modal
                title="Lịch thuê dịch vụ"
                open={calendarModalVisible}
                onCancel={() => setCalendarModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setCalendarModalVisible(false)}>
                        Đóng
                    </Button>
                ]}
                width={800}
            >
                {duplicateAlert && (
                    <Alert
                        message={duplicateAlert.message}
                        description={duplicateAlert.description}
                        type="error"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}
                <Calendar
                    fullscreen={true}
                    dateCellRender={calendarDateCellRender}
                />
            </Modal>
        </>
    );
};

export default ServiceDetail;
