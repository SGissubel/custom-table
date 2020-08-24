import { ITableCellData } from './table-cell-data.model';

export interface ITableCellCustomButton {
    disableCustomButton: boolean;
    disableCustomButtonMethod: (tableCell: ITableCellData) => boolean;
}
