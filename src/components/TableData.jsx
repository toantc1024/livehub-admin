import React, { useState, useEffect } from 'react';
import { Table, Space, Input, Button } from 'antd';
import { SearchOutlined, ExpandOutlined, ShrinkOutlined } from '@ant-design/icons';
import { createStyles } from 'antd-style';

const useStyle = createStyles(({ css, token }) => {
    const { antCls } = token;
    return {
        customTable: css`
            ${antCls}-table {
                ${antCls}-table-container {
                ${antCls}-table-body,
                ${antCls}-table-content {
                    scrollbar-width: thin;
                    scrollbar-color: #eaeaea transparent;
                    scrollbar-gutter: stable;
                }
                }
            }
            `,
        responsiveTable: css`
            @media (max-width: 768px) {
                .ant-table {
                    font-size: 12px;
                }
                .ant-table-thead > tr > th,
                .ant-table-tbody > tr > td {
                    padding: 8px 4px;
                }
            }
            @media (max-width: 480px) {
                .ant-table {
                    font-size: 11px;
                }
                .ant-table-thead > tr > th,
                .ant-table-tbody > tr > td {
                    padding: 6px 2px;
                }
            }
        `,
    };
});

const TableData = ({
    columns,
    dataSource,
    loading,
    handleTableChange,
    pageSize = 50,
    scrollY = 55 * 5,
    size = 'middle',
    searchable = false,
    searchField = 'title',
}) => {
    const { styles } = useStyle();
    const [searchText, setSearchText] = useState('');
    const [filteredData, setFilteredData] = useState(null);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [expandedView, setExpandedView] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Adjust columns based on screen size
    const getResponsiveColumns = () => {
        if (windowWidth < 768) {
            // For smaller screens, keep only the most important columns
            return enhancedColumns.filter(col => !col.hideOnMobile);
        }
        return enhancedColumns;
    };

    const handleSearch = (value) => {
        setSearchText(value);
        if (!value) {
            setFilteredData(null);
            return;
        }

        const filtered = dataSource.filter(item => {
            const fieldValue = item[searchField];
            return fieldValue && fieldValue.toLowerCase().includes(value.toLowerCase());
        });

        setFilteredData(filtered);
    };

    // Add sortable props to columns if not provided
    const enhancedColumns = columns.map(col => {
        // Skip if column already has sorter
        if (col.sorter) return col;

        // Make text columns sortable
        if (col.dataIndex && typeof col.render !== 'function') {
            return {
                ...col,
                sorter: (a, b) => {
                    const aValue = a[col.dataIndex];
                    const bValue = b[col.dataIndex];

                    if (typeof aValue === 'string' && typeof bValue === 'string') {
                        return aValue.localeCompare(bValue);
                    }

                    return (aValue || 0) - (bValue || 0);
                }
            };
        }

        return col;
    });

    // Determine table size based on screen width
    const getTableSize = () => {
        if (windowWidth < 576) return 'small';
        return size;
    };

    const toggleExpandView = () => {
        setExpandedView(!expandedView);
    };

    return (
        <div className={`${styles.customTable} ${styles.responsiveTable}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap' }}>
                {searchable && (
                    <Space style={{ marginBottom: 8 }}>
                        <Input
                            placeholder={`Tìm kiếm theo ${searchField}`}
                            value={searchText}
                            onChange={e => handleSearch(e.target.value)}
                            style={{ width: windowWidth < 576 ? 150 : 250 }}
                            allowClear
                            prefix={<SearchOutlined />}
                        />
                    </Space>
                )}
                <Button
                    type="text"
                    icon={expandedView ? <ShrinkOutlined /> : <ExpandOutlined />}
                    onClick={toggleExpandView}
                    style={{ marginLeft: 'auto' }}
                >
                    {windowWidth > 576 && (expandedView ? 'Thu nhỏ' : 'Phóng to')}
                </Button>
            </div>
            <Table
                size={getTableSize()}
                columns={getResponsiveColumns()}
                dataSource={filteredData || dataSource}
                onChange={handleTableChange}
                pagination={{
                    pageSize: windowWidth < 768 ? Math.min(10, pageSize) : pageSize,
                    size: windowWidth < 576 ? 'small' : 'default',
                    showSizeChanger: windowWidth > 576
                }}
                scroll={{
                    y: expandedView ? windowWidth * 0.6 : scrollY,
                    x: windowWidth < 768 ? 'max-content' : undefined
                }}
                loading={loading}
                rowClassName={() => expandedView ? 'expanded-row' : ''}
            />
        </div>
    );
};
export default TableData;