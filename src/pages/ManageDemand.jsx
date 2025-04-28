import React, { useEffect, useState, useTransition } from 'react'
import { Button, Tag, Alert, Modal, Calendar, Spin } from 'antd';
import { getAllDemands, getAllDemandsCSV } from '../services/item.service'
import { getAllDemandApplicationsByDemandId } from '../services/demand_application.service'
import TableData from '../components/TableData'
import { useNavigate } from 'react-router';
import { EyeOutlined, FileTextOutlined, CalendarOutlined } from '@ant-design/icons';
import { Space, Divider, Checkbox, message } from 'antd';
import { KeyWRapper } from '../utils/KeyWrapper';
import { CurrencyDelimiter } from '../utils/Currency';

const ManageDemand = () => {
    const navigate = useNavigate();
    const [calendarModalVisible, setCalendarModalVisible] = useState(false);
    const [selectedDemandApplications, setSelectedDemandApplications] = useState([]);
    const [currentDemandId, setCurrentDemandId] = useState(null);
    const [duplicateAlert, setDuplicateAlert] = useState(null);
    const [loadingCalendar, setLoadingCalendar] = useState(false);

    const handleExportDemands = async () => {
        try {
            if (!demands || demands.length === 0) {
                message.error('Không có dữ liệu nhu cầu để xuất');
                return;
            }

            // Define Vietnamese headers
            const headers = [
                'Tên nhu cầu',
                'Mô tả',
                'Thời gian bắt đầu',
                'Thời gian kết thúc',
                'Giá tối thiểu',
                'Giá tối đa',
                'Đơn vị tiền tệ',
                'Danh mục',
                'Trạng thái',
                'Ngày tạo',
                'Cần tư vấn',
                'Ghi chú',
                'ID chủ sở hữu',
                'Email chủ sở hữu',
                'Tên chủ sở hữu'
            ];

            // Transform demands data to CSV rows
            const csvRows = demands.map(demand => {
                // Format status in Vietnamese
                let status = 'Không xác định';
                if (demand.status === 'approved') status = 'Đã duyệt';
                else if (demand.status === 'pending') status = 'Chờ duyệt';
                else if (demand.status === 'rejected') status = 'Từ chối';

                // Format time slots
                const startTime = demand.selected_time_slots?.start ?
                    new Date(demand.selected_time_slots.start).toLocaleString('vi-VN') : 'Trống';
                const endTime = demand.selected_time_slots?.end ?
                    new Date(demand.selected_time_slots.end).toLocaleString('vi-VN') : 'Trống';

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
                    escapeField(demand.title),
                    escapeField(demand.description),
                    escapeField(startTime),
                    escapeField(endTime),
                    escapeField(demand.price_range?.min || 'Trống'),
                    escapeField(demand.price_range?.max || 'Trống'),
                    escapeField(demand.price_range?.currency || 'VND'),
                    escapeField(demand.category),
                    escapeField(status),
                    escapeField(new Date(demand.created_at).toLocaleDateString('vi-VN')),
                    escapeField(demand.need_support ? 'Có' : 'Không'),
                    escapeField(demand.note),
                    escapeField(demand.owner_id),
                    escapeField(demand.owner?.email),
                    escapeField(demand.owner?.raw_user_meta_data?.fullName)
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
            a.download = 'nhu_cau.csv';
            a.click();
            window.URL.revokeObjectURL(url);

            message.success('Xuất CSV nhu cầu thành công');
        } catch (err) {
            message.error('Lỗi khi xuất CSV nhu cầu: ' + err.message);
        }
    };

    // Function to show calendar with demand applications
    const showDemandCalendar = async (demandId) => {
        try {
            setCurrentDemandId(demandId);
            setCalendarModalVisible(true);
            setLoadingCalendar(true);

            // Get all applications for this demand
            const applications = await getAllDemandApplicationsByDemandId(demandId);
            setSelectedDemandApplications(applications || []);

            // Check for duplicate applications (overlapping dates)
            checkForDuplicateApplications(applications);
            setLoadingCalendar(false);
        } catch (err) {
            message.error('Lỗi khi lấy dữ liệu lịch đăng ký: ' + err.message);
            setLoadingCalendar(false);
        }
    };

    // Function to check for duplicate/overlapping application dates
    const checkForDuplicateApplications = (applications) => {
        if (!applications || applications.length < 2) {
            setDuplicateAlert(null);
            return;
        }

        // Collect all date slots from all applications
        const allDateSlots = {};
        let hasDuplicates = false;
        let duplicateDates = [];

        applications.forEach(application => {
            if (application.selected_time_slots?.slots) {
                application.selected_time_slots.slots.forEach(slot => {
                    const date = slot.split('T')[0]; // Extract just the date part
                    if (allDateSlots[date]) {
                        hasDuplicates = true;
                        duplicateDates.push(date);
                        allDateSlots[date].push(application.id);
                    } else {
                        allDateSlots[date] = [application.id];
                    }
                });
            }
        });

        if (hasDuplicates) {
            const uniqueDuplicateDates = [...new Set(duplicateDates)];
            setDuplicateAlert({
                message: 'Phát hiện trùng lịch đăng ký',
                description: `Có các ngày bị trùng lịch đăng ký: ${uniqueDuplicateDates.join(', ')}`,
                dates: uniqueDuplicateDates
            });
        } else {
            setDuplicateAlert(null);
        }
    };

    const columns = [
        {
            title: 'Tên nhu cầu',
            dataIndex: 'title',
            // width: 80,
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            width: 150,
            ellipsis: {
                showTitle: false,
            },
            render: (text) => (
                <span title={text}>{text}</span>
            )
        },
        {
            title: 'Thời gian',
            dataIndex: 'selected_time_slots',
            width: 150,
            render: (timeSlots) => {
                if (!timeSlots) return '-';
                return (
                    <span title={JSON.stringify(timeSlots)}>
                        {timeSlots.start ? new Date(timeSlots.start).toLocaleString() : '-'} - {timeSlots.end ? new Date(timeSlots.end).toLocaleString() : '-'}
                    </span>
                );
            }
        },
        {
            title: 'Giá',
            dataIndex: 'price_range',
            render: (_, record) => {
                return <span>{CurrencyDelimiter(record?.price_range?.min)} - {CurrencyDelimiter(record?.price_range?.max)} {record?.price_range?.currency}</span>
            }
        },
        {
            title: "Cần tư vấn",
            dataIndex: 'need_support',
            render: (_, record) => {
                // Checkbox
                return <Checkbox checked={record.need_support} />
            },
            width: 80,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            render: (_, record) => {
                return <Tag color={record.status === 'approved' ? 'green' : 'red'}>{record.status === 'approved' ? 'Đã duyệt' : 'Chưa duyệt'}</Tag>
            }
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => {
                return <Space>
                    <Button type='link' onClick={() => {
                        navigate(`/manage-demand/${record.id}`);
                    }}>
                        <EyeOutlined />
                        Xem chi tiết
                    </Button>

                </Space>
            }
        }

    ];
    const [isPending, startTransition] = useTransition();
    const [demands, setDemands] = useState([]);
    useEffect(() => {
        startTransition(async () => {
            let demands = await getAllDemands();
            setDemands(demands);
        })
    }, []);

    // Calendar date cell renderer to show application status
    const dateCellRender = (date) => {
        const dateStr = date.format('YYYY-MM-DD');
        const hasApplication = selectedDemandApplications.some(app =>
            app.selected_time_slots?.slots?.some(slot => slot.split('T')[0] === dateStr)
        );

        const isDuplicate = duplicateAlert?.dates?.includes(dateStr);

        if (hasApplication) {
            return (
                <div style={{
                    background: isDuplicate ? '#ff4d4f' : '#1677ff',
                    color: '#fff',
                    borderRadius: 4,
                    padding: 2,
                    textAlign: 'center',
                    fontSize: '11px'
                }}>
                    {isDuplicate ? 'Trùng lịch' : 'Đã đăng ký'}
                </div>
            );
        }
        return null;
    };

    // Responsive spin container
    const SpinContainer = ({ children, loading }) => (
        <div style={{ position: 'relative', minHeight: loading ? '200px' : 'auto' }}>
            {loading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.7)',
                    zIndex: 1000
                }}>
                    <Spin size="large" tip="Đang tải..." />
                </div>
            )}
            {children}
        </div>
    );

    return (
        <div>
            <Divider>Quản lý nhu cầu</Divider>
            <div style={{ marginBottom: 16 }} className='flexfitems-center'>
                <Button type="primary" icon={<FileTextOutlined />} onClick={handleExportDemands}>
                    Xuất CSV
                </Button>
            </div>
            <TableData
                bordered
                columns={columns}
                dataSource={KeyWRapper(demands)}
                handleTableChange={() => { }}
                pageSize={50}
                loading={isPending}
                scrollY={55 * 5}
                size='small'
            />

            {/* Calendar Modal */}
            <Modal
                title="Lịch đăng ký nhu cầu"
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
                <SpinContainer loading={loadingCalendar}>
                    <Calendar
                        fullscreen={true}
                        dateCellRender={dateCellRender}
                    />
                </SpinContainer>
            </Modal>
        </div>
    )
}

export default ManageDemand
