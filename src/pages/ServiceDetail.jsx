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
    const [postConfirmModalVisible, setPostConfirmModalVisible] = useState(false);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    // State for editable calendar in rental modal
    const [editableSlots, setEditableSlots] = useState([]);
    useEffect(() => {
        if (selectedRental) {
            if (selectedRental.selected_time_slots?.slots) {
                setEditableSlots(selectedRental.selected_time_slots.slots.map(s => s.split('T')[0]));
            } else if (selectedRental.selected_time_slots?.start && selectedRental.selected_time_slots?.end) {
                const dates = getSelectedDates(selectedRental.selected_time_slots);
                setEditableSlots(dates);
            } else {
                setEditableSlots([]);
            }
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
                    days: data.date_range?.days || [],
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
                },
                image_urls: values.image_urls || service.image_urls
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
        message.info('Bạn sắp duyệt dịch vụ này. Vui lòng xác nhận!');
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
            // Define Vietnamese headers
            const headers = [
                'Tên dịch vụ',
                'Tên nhà cung cấp',
                'Tên người thuê',
                'Danh sách ngày chọn',
                'Email',
                'Địa chỉ',
                'Số điện thoại',
                'Giá mong muốn',
                'Trạng thái',
                'Ghi chú',
                'Trải nghiệm trước đây',
                'Ngày tạo'
            ];

            // Transform rentalList data to CSV rows
            const csvRows = rentalList.map(rental => {
                const contactInfo = parseContactInfo(rental.contact_info);
                const dates = getSelectedDates(rental.selected_time_slots)
                    .map(date => formatDateToWeekday(date))
                    .join('; ');

                const renterName = contactInfo.name || rental.buyer?.raw_user_meta_data?.fullName || 'Trống';
                const email = contactInfo.email || rental.buyer?.raw_user_meta_data?.email || 'Trống';
                const address = contactInfo.address || 'Trống';
                const phone = contactInfo.phone || 'Trống';

                let status = 'Chưa duyệt';
                if (rental.status === 'approved') status = 'Đã duyệt';
                else if (rental.status === 'pending') status = 'Chờ duyệt';

                const priceRange = rental.expect_price_range ?
                    `${CurrencyFormat(rental.expect_price_range.min)} - ${CurrencyFormat(rental.expect_price_range.max)}` : 'Trống';

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
                    escapeField(rental.item?.title),
                    escapeField(rental.item?.owner?.raw_user_meta_data?.fullName),
                    escapeField(renterName),
                    dates.length > 0 ? escapeField(dates) : 'Trống',
                    escapeField(email),
                    escapeField(address),
                    escapeField(phone),
                    escapeField(priceRange),
                    escapeField(status),
                    escapeField(rental.note),
                    escapeField(rental.previous_service_experience),
                    escapeField(new Date(rental.created_at).toLocaleDateString('vi-VN'))
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
            a.download = `danh_sach_thue_${id}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            messageApi.success('Xuất CSV thành công');
        } catch (err) {
            message.error('Lỗi khi xuất CSV thuê dịch vụ: ' + err.message);
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

    // Helper to get selected dates from different time slot formats
    const getSelectedDates = (timeSlots) => {
        if (!timeSlots) return [];

        if (timeSlots.slots) {
            return timeSlots.slots.map(slot => slot.split('T')[0]);
        }

        if (timeSlots.start && timeSlots.end) {
            const start = new Date(timeSlots.start);
            const end = new Date(timeSlots.end);
            const dates = [];

            for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
                dates.push(dt.toISOString().split('T')[0]);
            }

            return dates;
        }

        return [];
    };

    // Helper to format dates to Vietnamese weekday names
    const formatDateToWeekday = (dateStr) => {
        const date = new Date(dateStr);
        const day = date.getDay();
        const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        return `${weekdays[day]} (${dateStr})`;
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

    const options = [];

    for (let i = 10; i < 36; i++) {
        options.push({
            value: i.toString(36) + i,
            label: i.toString(36) + i,
        });
    }

    // Check for duplicates when viewing a specific rental
    const checkRentalForDuplicates = (rental) => {
        if (!rental || !rentalList || rentalList.length < 2) {
            return false;
        }

        const rentalDates = getSelectedDates(rental.selected_time_slots);
        if (rentalDates.length === 0) return false;

        // Check if any other rental has the same dates
        const otherRentals = rentalList.filter(r => r.id !== rental.id);

        for (const date of rentalDates) {
            for (const otherRental of otherRentals) {
                const otherDates = getSelectedDates(otherRental.selected_time_slots);
                if (otherDates.includes(date)) {
                    return true;
                }
            }
        }

        return false;
    };

    const rentalColumns = [
        {
            title: 'Tên dịch vụ',
            dataIndex: 'item',
            render: (item) => item?.title || '',
            width: 150,
        },
        {
            title: 'Tên nhà cung cấp',
            dataIndex: 'item',
            render: (item) => item?.owner?.raw_user_meta_data?.fullName || '',
            width: 150,
        },
        {
            title: 'Tên người thuê',
            dataIndex: 'buyer',
            render: (buyer, record) => {
                // Try to get name from contact_info first, then fall back to user metadata
                const contactInfo = parseContactInfo(record.contact_info);
                if (contactInfo.name) return contactInfo.name;
                return buyer?.raw_user_meta_data?.fullName || '';
            },
            width: 150,
        },
        {
            title: 'Khoảng giá mong muốn',
            dataIndex: 'expect_price_range',
            render: (val) => val ? `${CurrencyFormat(val.min)} - ${CurrencyFormat(val.max)}` : '',
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
            title: 'Ghi chú',
            dataIndex: 'note',
            width: 150,
        },
        {
            title: 'Thao tác',
            key: 'action',
            fixed: 'right',
            width: 100,
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

    // Force re-render modal content when rental status changes
    useEffect(() => {
        if (selectedRental) {
            // Find the updated rental from the list to ensure we have the latest data
            const updatedRental = rentalList.find(r => r.id === selectedRental.id);
            if (updatedRental) {
                setSelectedRental(updatedRental);
            }
        }
    }, [rentalList, selectedRental?.id]);

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
                                    <InputNumber
                                        min={0}
                                        style={{ width: '100%' }}
                                        addonAfter="VND"
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                                        parser={value => value.replace(/\./g, '')}
                                    />
                                </Form.Item>
                                <Form.Item label="Khoảng giá tối đa" name="max" rules={[{ required: true, message: 'Vui lòng nhập giá tối đa' }]}>
                                    <InputNumber
                                        min={0}
                                        style={{ width: '100%' }}
                                        addonAfter="VND"
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                                        parser={value => value.replace(/\./g, '')}
                                    />
                                </Form.Item>
                                <Form.Item label="Ngày cho thuê trong tuần" name="days">
                                    <Select
                                        mode="multiple"
                                        options={[
                                            { label: 'Thứ Hai', value: 'mon' },
                                            { label: 'Thứ Ba', value: 'tue' },
                                            { label: 'Thứ Tư', value: 'wed' },
                                            { label: 'Thứ Năm', value: 'thu' },
                                            { label: 'Thứ Sáu', value: 'fri' },
                                            { label: 'Thứ Bảy', value: 'sat' },
                                            { label: 'Chủ Nhật', value: 'sun' },
                                        ]}
                                        onChange={(value) => {
                                            form.setFieldsValue({ days: value });
                                        }}
                                        value={service?.date_range?.days || []}
                                        placeholder="Chọn ngày"
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
                                            value={service?.image_urls || []}
                                            onChange={(newImages) => {
                                                const updatedService = { ...service, image_urls: newImages };
                                                setService(updatedService);
                                                form.setFieldsValue({ image_urls: newImages });
                                            }}
                                        />
                                    ) : (
                                        service?.image_urls?.length > 0 ? (
                                            <div className="image-slider" style={{ width: '100%', overflow: 'hidden' }}>
                                                <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', padding: '10px 0' }}>
                                                    {service.image_urls.map((url, index) => (
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
                                                        rules={[{ required: true, message: 'Vui lòng chọn nền tảng' }]}
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
                                                        rules={[{ required: true, message: 'Vui lòng nhập thông tin liên hệ' }]}
                                                        style={{ flex: '2 1 200px', minWidth: 180, marginBottom: 0 }}
                                                    >
                                                        <Input placeholder="Thông tin liên hệ" />
                                                    </Form.Item>
                                                    <MinusCircleOutlined onClick={() => remove(field.name)} style={{ color: '#ff4d4f', fontSize: 18, cursor: 'pointer' }} />
                                                </div>
                                            ))}

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
                                searchField="note"
                                scroll={{ x: 1200 }}
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
                    <Descriptions.Item label="Tên dịch vụ">{service?.title}</Descriptions.Item>
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
                    <Descriptions.Item label="Hình ảnh">
                        {service?.image_urls?.length > 0 ? (
                            <div className="image-slider" style={{ width: '100%', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', padding: '10px 0' }}>
                                    {service.image_urls.map((url, index) => (
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
                                    // Update both the list and the selected rental
                                    const updatedRental = { ...selectedRental, status: 'approved' };
                                    setSelectedRental(updatedRental);
                                    setRentalList(list => list.map(r => r.id === selectedRental.id ? updatedRental : r));
                                    setRentalLoading(false);
                                    message.success('Đã duyệt yêu cầu thuê');
                                }
                            });
                        } else {
                            setRentalLoading(true);
                            await updateServiceRentalById(selectedRental.id, { status: 'approved' });
                            // Update both the list and the selected rental
                            const updatedRental = { ...selectedRental, status: 'approved' };
                            setSelectedRental(updatedRental);
                            setRentalList(list => list.map(r => r.id === selectedRental.id ? updatedRental : r));
                            setRentalLoading(false);
                            message.success('Đã duyệt yêu cầu thuê');
                        }
                    }}>Duyệt</Button>,
                    <Button key="close" onClick={() => setRentalDetailModal(false)}>Đóng</Button>
                ] : [<Button key="close" onClick={() => setRentalDetailModal(false)}>Đóng</Button>]}
                width={1000}
            >
                {selectedRental && (
                    <Descriptions
                        bordered
                        column={1}
                        size="small"
                        labelStyle={{ whiteSpace: 'nowrap' }}
                    >
                        <Descriptions.Item label="Tên dịch vụ">{selectedRental.item?.title}</Descriptions.Item>
                        <Descriptions.Item label="Tên nhà cung cấp">{selectedRental.item?.owner?.raw_user_meta_data?.fullName}</Descriptions.Item>
                        <Descriptions.Item label="Tên người thuê">{selectedRental.buyer?.raw_user_meta_data?.fullName}</Descriptions.Item>
                        <Descriptions.Item label="Ghi chú cho quản trị viên">{selectedRental.note}</Descriptions.Item>
                        <Descriptions.Item label="Khoảng giá mong muốn">
                            {CurrencyFormat(selectedRental?.expect_price_range?.min)} - {CurrencyFormat(selectedRental?.expect_price_range?.max)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Thông tin liên hệ">
                            {(() => {
                                const contactInfo = parseContactInfo(selectedRental.contact_info);
                                return (
                                    <div>
                                        {contactInfo.name && <div><strong>Tên:</strong> {contactInfo.name}</div>}
                                        {contactInfo.email && <div><strong>Email:</strong> {contactInfo.email}</div>}
                                        {contactInfo.phone && <div><strong>Số điện thoại:</strong> {contactInfo.phone}</div>}
                                        {contactInfo.address && <div><strong>Địa chỉ:</strong> {contactInfo.address}</div>}
                                        {selectedRental.buyer?.raw_user_meta_data?.email && <div><strong>Email đăng ký:</strong> {selectedRental.buyer.raw_user_meta_data.email}</div>}
                                        {selectedRental.buyer?.raw_user_meta_data?.address && <div><strong>Địa chỉ đăng ký:</strong> {selectedRental.buyer.raw_user_meta_data.address}</div>}
                                    </div>
                                );
                            })()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trải nghiệm trước đây">{selectedRental.previous_service_experience}</Descriptions.Item>
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
                        <Descriptions.Item label="Danh sách ngày đã chọn">
                            {(() => {
                                const dates = getSelectedDates(selectedRental.selected_time_slots);
                                return (
                                    <div>
                                        {dates.map((date, index) => (
                                            <div key={index}>{formatDateToWeekday(date)}</div>
                                        ))}
                                    </div>
                                );
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

            {/* Post creation confirmation modal */}
            <Modal
                title="Tạo bài đăng cho dịch vụ"
                open={postConfirmModalVisible}
                onCancel={() => setPostConfirmModalVisible(false)}
                footer={[
                    <Button key="no" onClick={() => setPostConfirmModalVisible(false)}>
                        Không
                    </Button>,
                    <Button key="yes" type="primary" onClick={() => {
                        setPostConfirmModalVisible(false);
                        navigate(`/manage-service/${id}/post`);
                    }}>
                        Có
                    </Button>
                ]}
            >
                <p>Bạn có muốn cập nhật bài đăng cho dịch vụ này không?</p>
            </Modal>

            {/* Custom Confirm Modal for Service Approval */}
            <Modal
                title="Xác nhận duyệt dịch vụ"
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
                            const updatedService = {
                                ...service,
                                status: 'approved',
                            };
                            const { error } = await updateServiceById(id, updatedService);
                            if (error) {
                                messageApi.error('Lỗi khi duyệt dịch vụ: ' + error.message);
                                setLoading(false);
                                return;
                            }

                            // Force UI update by refreshing the service data
                            const { data } = await getServiceById(id);
                            if (data && data.length > 0) {
                                const refreshedService = data[0];
                                setService(refreshedService);

                                // Update form with fresh data
                                form.setFieldsValue({
                                    title: refreshedService.title,
                                    description: refreshedService.description,
                                    min: refreshedService.price_range?.min,
                                    max: refreshedService.price_range?.max,
                                    days: refreshedService.date_range?.days || [],
                                    category: refreshedService.category,
                                    note: refreshedService.note,
                                    status: refreshedService.status,
                                    contacts: refreshedService.contact_info?.contacts || [],
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
                <p>Bạn có chắc chắn muốn duyệt dịch vụ này?</p>
                <p>Việc duyệt sẽ cho phép bạn tạo bài đăng.</p>
            </Modal>
        </>
    );
};

export default ServiceDetail;
