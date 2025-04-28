import React, { useEffect, useState, useTransition } from 'react'
import { Button, Tag } from 'antd';
import { getAllServices, getAllServiceCSV } from '../services/item.service'
import TableData from '../components/TableData'
import { useNavigate } from 'react-router';
import { EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import { Space, Divider, Checkbox, message } from 'antd';
import { KeyWRapper } from '../utils/KeyWrapper';
import { CurrencyDelimiter } from '../utils/Currency';

const ManageService = () => {
    const navigate = useNavigate();

    const handleExportServices = async () => {
        try {
            const services = await getAllServices();
            if (!services || services.length === 0) {
                message.error('Không có dữ liệu dịch vụ để xuất');
                return;
            }

            // Define Vietnamese headers
            const headers = [
                'Tên dịch vụ',
                'Mô tả',
                'Giá tối thiểu',
                'Giá tối đa',
                'Đơn vị tiền tệ',
                'Ngày cho thuê',
                'Danh mục',
                'Trạng thái',
                'Ngày tạo',
                'Cần tư vấn',
                'Ghi chú',
                'ID chủ sở hữu',
                'Email chủ sở hữu',
                'Tên chủ sở hữu'
            ];

            // Transform services data to CSV rows
            const csvRows = services.map(service => {
                // Format weekdays in Vietnamese
                const formatWeekday = (day) => {
                    const weekdayMap = {
                        'mon': 'Thứ Hai',
                        'tue': 'Thứ Ba',
                        'wed': 'Thứ Tư',
                        'thu': 'Thứ Năm',
                        'fri': 'Thứ Sáu',
                        'sat': 'Thứ Bảy',
                        'sun': 'Chủ Nhật'
                    };
                    return weekdayMap[day] || day;
                };

                const days = service.date_range?.days
                    ? (Array.isArray(service.date_range.days)
                        ? service.date_range.days.map(formatWeekday).join('; ')
                        : formatWeekday(service.date_range.days))
                    : 'Trống';

                // Format status in Vietnamese
                let status = 'Không xác định';
                if (service.status === 'approved') status = 'Đã duyệt';
                else if (service.status === 'pending') status = 'Chờ duyệt';
                else if (service.status === 'rejected') status = 'Từ chối';

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
                    escapeField(service.title),
                    escapeField(service.description),
                    escapeField(service.price_range?.min || 'Trống'),
                    escapeField(service.price_range?.max || 'Trống'),
                    escapeField(service.price_range?.currency || 'VND'),
                    escapeField(days),
                    escapeField(service.category),
                    escapeField(status),
                    escapeField(new Date(service.created_at).toLocaleDateString('vi-VN')),
                    escapeField(service.need_support ? 'Có' : 'Không'),
                    escapeField(service.note),
                    escapeField(service.owner_id),
                    escapeField(service.owner?.email),
                    escapeField(service.owner?.raw_user_meta_data?.fullName)
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
            a.download = 'dich_vu.csv';
            a.click();
            window.URL.revokeObjectURL(url);

            message.success('Xuất CSV dịch vụ thành công');
        } catch (err) {
            message.error('Lỗi khi xuất CSV dịch vụ: ' + err.message);
        }
    };

    const columns = [
        {
            title: 'Tên dịch vụ',
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
                return <Checkbox disabled checked={record.need_support} />
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
                        navigate(`/manage-service/${record.id}`);
                    }}>
                        <EyeOutlined />
                        Xem chi tiết
                    </Button>
                </Space>
            }
        }

    ];
    const [isPending, startTransition] = useTransition();
    const [services, setServices] = useState([]);
    useEffect(() => {
        startTransition(async () => {
            let services = await getAllServices();
            setServices(services);
        })
    }, []);

    return (
        <div>

            <Divider>Quản lý dịch vụ</Divider>
            <div style={{ marginBottom: 16 }} className='flexfitems-center'>
                <Button type="primary" icon={<FileTextOutlined />} onClick={handleExportServices}>
                    Xuất CSV
                </Button>
            </div>
            <TableData
                bordered
                columns={columns}
                dataSource={KeyWRapper(services)}
                handleTableChange={() => { }}
                pageSize={50}
                loading={isPending}
                scrollY={55 * 5}
                size='small'
            />

        </div>
    )
}

export default ManageService
