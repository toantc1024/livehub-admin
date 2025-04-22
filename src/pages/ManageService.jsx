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
            const { data, error } = await getAllServiceCSV();
            if (error) {
                message.error('Lỗi khi xuất CSV dịch vụ: ' + error.message);
                return;
            }
            const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'services.csv';
            a.click();
            window.URL.revokeObjectURL(url);
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
