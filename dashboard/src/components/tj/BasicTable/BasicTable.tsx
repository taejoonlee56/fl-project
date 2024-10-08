import React, { useEffect, useState, useCallback } from 'react';
import { Col, Row, Space, TablePaginationConfig } from 'antd';
import { BasicTableRow, getBasicTableData, Pagination, Tag } from '@app/components/tj/BasicTable/tj_table.api';
import { Table } from 'components/common/Table/Table';
import { ColumnsType } from 'antd/es/table';
import { Button } from 'components/common/buttons/Button/Button';
import { useTranslation } from 'react-i18next';
import { defineColorByPriority } from '@app/utils/utils';
import { notificationController } from 'controllers/notificationController';
import { Status } from '@app/components/profile/profileCard/profileFormNav/nav/payments/paymentHistory/Status/Status';
import { useMounted } from '@app/hooks/useMounted';
import { useTheme } from 'styled-components';

const initialPagination: Pagination = {
  current: 1,
  ptrainSize: 5,
};

export const BasicTable: React.FC = () => {
  const [tableData, setTableData] = useState<{ data: BasicTableRow[]; pagination: Pagination; loading: boolean }>({
    data: [],
    pagination: initialPagination,
    loading: false,
  });
  const { t } = useTranslation();
  const { isMounted } = useMounted();

  const theme = useTheme();

  const fetch = useCallback(
    (pagination: Pagination) => {
      setTableData((tableData) => ({ ...tableData, loading: true }));
      getBasicTableData(pagination).then((res) => {
        if (isMounted.current) {
          setTableData({ data: res.data, pagination: res.pagination, loading: false });
        }
      });
    },
    [isMounted],
  );

  useEffect(() => {
    fetch(initialPagination);
  }, [fetch]);

  const handleTableChange = (pagination: TablePaginationConfig) => {
    fetch(pagination);
  };

  const handleDeleteRow = (rowId: number) => {
    setTableData({
      ...tableData,
      data: tableData.data.filter((item) => item.key !== rowId),
      pagination: {
        ...tableData.pagination,
        // total: tableData.pagination.total ? tableData.pagination.total - 1 : tableData.pagination.total,
        total: tableData.pagination.total,
      },
    });
  };

  const columns: ColumnsType<BasicTableRow> = [
    {
      title: t('common.name'),
      dataIndex: 'name',
      render: (text: string) => <span>{text}</span>,
      filterMode: 'tree',
      filterSearch: true,
      filters: [
        {
          text: t('common.firstName'),
          value: 'firstName',
          children: [
            {
              text: 'TJ',
              value: 'TJ',
            },
            {
              text: 'TJ',
              value: 'TJ',
            },
            {
              text: 'TJ',
              value: 'TJ',
            },
            {
              text: 'TJ',
              value: 'TJ',
            },
          ],
        },
        {
          text: t('common.lastName'),
          value: 'lastName',
          children: [
            {
              text: 'Green',
              value: 'Green',
            },
            {
              text: 'Black',
              value: 'Black',
            },
            {
              text: 'Brown',
              value: 'Brown',
            },
          ],
        },
      ],
      onFilter: (value: string | number | boolean, record: BasicTableRow) => record.name.includes(value.toString()),
    },
    {
      // title: t('common.train'),
      title: t('Battery Capacity(kWh)'),
      dataIndex: 'batterycapacity',
    },
    {
      // title: t('common.train'),
      title: t('Charge Power(kW)'),
      dataIndex: 'chargingpower',
      sorter: (a: BasicTableRow, b: BasicTableRow) => a.key - b.batterycapacity,
      showSorterTooltip: false,
    },
    {
      title: t('Initial Battery Level(kWh)'),
      dataIndex: 'batterylevel',
    },
    {
      title: t('C-rate'),
      dataIndex: 'crate',
    },
    // {
    //   title: t('common.tags'),
    //   key: 'tags',
    //   dataIndex: 'tags',
    //   render: (tags: Tag[]) => (
    //     <Row gutter={[10, 10]}>
    //       {tags.map((tag: Tag) => {
    //         return (
    //           <Col key={tag.value}>
    //             <Status color={defineColorByPriority(tag.priority, theme)} text={tag.value.toUpperCase()} />
    //           </Col>
    //         );
    //       })}
    //     </Row>
    //   ),
    // },
    // {
    //   title: t('tables.actions'),
    //   dataIndex: 'actions',
    //   width: '15%',
    //   render: (text: string, record: { name: string; key: number }) => {
    //     return (
    //       <Space>
    //         <Button
    //           type="ghost"
    //           onClick={() => {
    //             notificationController.info({ messtrain: t('tables.inviteMesstrain', { name: record.name }) });
    //           }}
    //         >
    //           {t('tables.invite')}
    //         </Button>
    //         <Button type="default" danger onClick={() => handleDeleteRow(record.key)}>
    //           {t('tables.delete')}
    //         </Button>
    //       </Space>
    //     );
    //   },
    // },
  ];

  return (
    <Table
      columns={columns}
      dataSource={tableData.data}
      pagination={tableData.pagination}
      loading={tableData.loading}
      onChange={handleTableChange}
      scroll={{ x: 50 }}
      bordered
    />
  );
};
