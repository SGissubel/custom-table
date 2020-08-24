import { ITableColumns } from './table-columns.model';

export interface ITableSettingsUpdate {
    columns: ITableColumns[];
    tableId: string;
    saveType: number;
    resetTable?: boolean;
}
