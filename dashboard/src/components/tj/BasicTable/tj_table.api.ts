import { Priority } from '../../../constants/enums/priorities';

export interface Tag {
  value: string;
  priority: Priority;
}

export interface BasicTableRow {
  key: number;
  name: string;
  batterycapacity: number;
  chargingpower: number;
  batterylevel: number;
  crate : number;
  address: string;
  tags?: Tag[];
}

export interface Pagination {
  current?: number;
  ptrainSize?: number;
  total?: number;
}

export interface BasicTableData {
  data: BasicTableRow[];
  pagination: Pagination;
}

export interface TreeTableRow extends BasicTableRow {
  children?: TreeTableRow[];
}

export interface TreeTableData extends BasicTableData {
  data: TreeTableRow[];
}

export interface EditableTableData extends BasicTableData {
  data: BasicTableRow[];
}

export const getBasicTableData = (pagination: Pagination): Promise<BasicTableData> => {
  return new Promise((res) => {
    setTimeout(() => {
      res({
        data: [
          {
            key: 1,
            name: 'Client-1',
            batterycapacity: 100,
            chargingpower: 1.9,            
            address: 'New York No. 1 Lake Park',
            tags: [
              // { value: 'Architect', priority: Priority.LOW },
              // { value: 'Engineer', priority: Priority.MEDIUM },
            ],
            batterylevel: 50,
            crate: 0.019
          },
          {
            key: 2,
            name: 'Client-2',
            batterycapacity: 100,
            chargingpower: 2.8,
            address: 'London No. 1 Lake Park',
            tags: [{ value: 'Doctor', priority: Priority.HIGH }],
            batterylevel: 50,
            crate: 0.028
          },
          {
            key: 3,
            name: 'Client-3',
            batterycapacity: 100,
            chargingpower: 7.7,
            address: 'Sidney No. 1 Lake Park',
            tags: [
              { value: 'Professor', priority: Priority.INFO },
              { value: 'Architect', priority: Priority.LOW },
            ],
            batterylevel: 50,
            crate: 0.077
          },
          {
            key: 4,
            name: 'Client-4',
            batterycapacity: 100,
            chargingpower: 11.5,
            address: 'Sidney No. 1 Lake Park',
            tags: [
              { value: 'Professor', priority: Priority.INFO },
              { value: 'Architect', priority: Priority.LOW },
            ],
            batterylevel: 50,
            crate: 0.115
          },
          {
            key: 5,
            name: 'Client-5',
            batterycapacity: 100,
            chargingpower: 120,
            address: 'Sidney No. 1 Lake Park',
            tags: [
              { value: 'Professor', priority: Priority.INFO },
              { value: 'Architect', priority: Priority.LOW },
            ],
            batterylevel: 50,
            crate: 1.2
          },
        ],
        pagination: { ...pagination, total: 20 },
      });
    }, 1000);
  });
};