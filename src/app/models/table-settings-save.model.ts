import { ITableColumns } from './table-columns.model';

export interface ITableSettingsSave {
    columns: ITableColumns[];
    tableGuid: string;
    saveType: number;
    resetTable?: boolean;
}
