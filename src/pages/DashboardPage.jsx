import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Divider, Typography, Tabs, DatePicker, Radio } from 'antd';
import { UserOutlined, ShoppingCartOutlined, DollarOutlined, FileOutlined } from '@ant-design/icons';
import { getAllServices, getAllDemands } from '../services/item.service';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from 'recharts';

const { Title } = Typography;
const { RangePicker } = DatePicker;

// Theme colors
const COLORS = ['#f5770b', '#ff8a24', '#ffb74d', '#ffd8a8', '#fff9f0'];
const CHART_COLORS = {
    orange: '#f5770b',
    darkOrange: '#d45e00',
    lightOrange: '#ff8a24',
    accentOrange: '#ffb74d',
    paleOrange: '#ffd8a8'
};

const DashboardPage = () => {
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState([]);
    const [demands, setDemands] = useState([]);
    const [displayType, setDisplayType] = useState('all');
    const [stats, setStats] = useState({
        totalServices: 0,
        totalDemands: 0,
        pendingServices: 0,
        pendingDemands: 0,
        approvedServices: 0,
        approvedDemands: 0,
        rejectedServices: 0,
        rejectedDemands: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const servicesData = await getAllServices();
                const demandsData = await getAllDemands();

                setServices(servicesData || []);
                setDemands(demandsData || []);

                const pendingServices = servicesData?.filter(s => s.status === 'pending').length || 0;
                const approvedServices = servicesData?.filter(s => s.status === 'approved').length || 0;
                const rejectedServices = servicesData?.filter(s => s.status === 'rejected').length || 0;

                const pendingDemands = demandsData?.filter(d => d.status === 'pending').length || 0;
                const approvedDemands = demandsData?.filter(d => d.status === 'approved').length || 0;
                const rejectedDemands = demandsData?.filter(d => d.status === 'rejected').length || 0;

                setStats({
                    totalServices: servicesData?.length || 0,
                    totalDemands: demandsData?.length || 0,
                    pendingServices,
                    pendingDemands,
                    approvedServices,
                    approvedDemands,
                    rejectedServices,
                    rejectedDemands
                });

                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getCategoryData = (items) => {
        const categories = {};
        items.forEach(item => {
            if (item.category) {
                categories[item.category] = (categories[item.category] || 0) + 1;
            }
        });

        return Object.entries(categories).map(([category, count]) => ({
            type: category,
            value: count
        }));
    };

    const getStatusData = (items) => {
        const statusCount = {
            pending: 0,
            approved: 0,
            rejected: 0
        };

        items.forEach(item => {
            if (item.status) {
                statusCount[item.status] = (statusCount[item.status] || 0) + 1;
            }
        });

        return Object.entries(statusCount).map(([status, count]) => ({
            type: status.charAt(0).toUpperCase() + status.slice(1),
            value: count
        }));
    };

    const getTimeSeriesData = (items) => {
        const months = {};
        items.forEach(item => {
            const date = new Date(item.created_at);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            months[monthYear] = (months[monthYear] || 0) + 1;
        });

        return Object.entries(months).map(([month, count]) => ({
            month,
            count
        }));
    };

    const compareTimeSeriesData = () => {
        const servicesData = getTimeSeriesData(services).map(item => ({
            month: item.month,
            count: item.count,
            type: 'Services'
        }));

        const demandsData = getTimeSeriesData(demands).map(item => ({
            month: item.month,
            count: item.count,
            type: 'Demands'
        }));

        return [...servicesData, ...demandsData];
    };

    const getPriceRangeData = (items) => {
        const priceRanges = {
            'Under $50': 0,
            '$50-$100': 0,
            '$100-$500': 0,
            '$500-$1000': 0,
            'Over $1000': 0,
        };

        items.forEach(item => {
            if (item.price_range) {
                try {
                    const priceData = typeof item.price_range === 'string'
                        ? JSON.parse(item.price_range)
                        : item.price_range;

                    const minPrice = priceData.min || 0;

                    if (minPrice < 50) {
                        priceRanges['Under $50']++;
                    } else if (minPrice < 100) {
                        priceRanges['$50-$100']++;
                    } else if (minPrice < 500) {
                        priceRanges['$100-$500']++;
                    } else if (minPrice < 1000) {
                        priceRanges['$500-$1000']++;
                    } else {
                        priceRanges['Over $1000']++;
                    }
                } catch (error) {
                    console.error('Error parsing price range:', error);
                }
            }
        });

        return Object.entries(priceRanges).map(([range, count]) => ({
            type: range,
            value: count
        }));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spin size="large" />
            </div>
        );
    }

    // Card styles
    const cardStyle = {
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        borderRadius: '12px',
        border: '1px solid #ffd8a8',
    };

    const cardHeadStyle = {
        borderBottom: '1px solid #ffd8a8',
        color: '#d45e00',
        fontWeight: 600
    };

    return (
        <div className="p-6">
            <Title level={2} style={{ color: '#f5770b', marginBottom: 24 }}>Tổng quan hệ thống </Title>
            <Divider style={{ borderColor: '#ffd8a8' }} />

            <Row gutter={16} className="mb-6">
                <Col span={6}>
                    <Card style={cardStyle}>
                        <Statistic
                            title={<span style={{ color: '#f5770b' }}>Tổng dịch vụ</span>}
                            value={stats.totalServices}
                            valueStyle={{ color: '#d45e00' }}
                            prefix={<ShoppingCartOutlined style={{ color: '#f5770b' }} />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card style={cardStyle}>
                        <Statistic
                            title={<span style={{ color: '#f5770b' }}>Tổng nhu cầu</span>}
                            value={stats.totalDemands}
                            valueStyle={{ color: '#d45e00' }}
                            prefix={<FileOutlined style={{ color: '#f5770b' }} />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card style={cardStyle}>
                        <Statistic
                            title={<span style={{ color: '#f5770b' }}>Đang chờ phê duyệt</span>}
                            value={stats.pendingServices + stats.pendingDemands}
                            valueStyle={{ color: '#d45e00' }}
                            prefix={<UserOutlined style={{ color: '#f5770b' }} />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card style={cardStyle}>
                        <Statistic
                            title={<span style={{ color: '#f5770b' }}>Mục đã phê duyệt</span>}
                            value={stats.approvedServices + stats.approvedDemands}
                            valueStyle={{ color: '#d45e00' }}
                            prefix={<DollarOutlined style={{ color: '#f5770b' }} />}
                        />
                    </Card>
                </Col>
            </Row>

            <Tabs defaultActiveKey="3" type="card">
                <Tabs.TabPane tab="Tổng quan trạng thái" key="1">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Card title="Trạng thái dịch vụ" style={cardStyle} headStyle={cardHeadStyle}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={getStatusData(services)} dataKey="value" nameKey="type" outerRadius={100} label>
                                            {getStatusData(services).map((entry, index) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card title="Trạng thái nhu cầu" style={cardStyle} headStyle={cardHeadStyle}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={getStatusData(demands)} dataKey="value" nameKey="type" outerRadius={100} label>
                                            {getStatusData(demands).map((entry, index) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Card>
                        </Col>
                    </Row>
                </Tabs.TabPane>

                <Tabs.TabPane tab="Phân loại" key="2">
                    <Row gutter={16}>
                        <Col span={24}>
                            <Card title="Phân loại dịch vụ" style={cardStyle} headStyle={cardHeadStyle}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={getCategoryData(services)} dataKey="value" nameKey="type" outerRadius={100} label>
                                            {getCategoryData(services).map((entry, index) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Card>
                        </Col>
                    </Row>
                </Tabs.TabPane>

                <Tabs.TabPane tab="Xu hướng" key="3">
                    <Row gutter={16}>
                        <Col span={24}>
                            <Card title="Thống kê hàng tháng" extra={<RangePicker />} style={cardStyle} headStyle={cardHeadStyle}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={getTimeSeriesData([...services, ...demands])} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="count" fill={CHART_COLORS.orange} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card>
                        </Col>
                    </Row>
                    <Row gutter={16} className="mt-4">
                        <Col span={24}>
                            <Card title="So sánh Dịch vụ và Nhu cầu" style={cardStyle} headStyle={cardHeadStyle}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={compareTimeSeriesData()} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="count" data={compareTimeSeriesData().filter(d => d.type === 'Services')} name="Services" stroke={CHART_COLORS.orange} />
                                        <Line type="monotone" dataKey="count" data={compareTimeSeriesData().filter(d => d.type === 'Demands')} name="Demands" stroke={CHART_COLORS.darkOrange} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Card>
                        </Col>
                    </Row>
                </Tabs.TabPane>

                <Tabs.TabPane tab="Phân tích giá" key="4">
                    <Row gutter={16}>
                        <Col span={24}>
                            <Card
                                title="Phân bố khoảng giá"
                                style={cardStyle}
                                headStyle={cardHeadStyle}
                                extra={
                                    <Radio.Group
                                        value={displayType}
                                        onChange={e => setDisplayType(e.target.value)}
                                    >
                                        <Radio.Button value="all">Tất cả</Radio.Button>
                                        <Radio.Button value="services">Dịch vụ</Radio.Button>
                                        <Radio.Button value="demands">Nhu cầu</Radio.Button>
                                    </Radio.Group>
                                }
                            >
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={getPriceRangeData(displayType === 'services' ? services : displayType === 'demands' ? demands : [...services, ...demands])} dataKey="value" nameKey="type" innerRadius={60} outerRadius={100} label>
                                            {getPriceRangeData(displayType === 'services' ? services : displayType === 'demands' ? demands : [...services, ...demands]).map((entry, index) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Card>
                        </Col>
                    </Row>
                </Tabs.TabPane>
            </Tabs>
        </div>
    );
};

export default DashboardPage;