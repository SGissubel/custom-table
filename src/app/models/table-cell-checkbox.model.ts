import { ITableCellData } from './table-cell-data.model';

export interface ITableCellCheckBox {
    disableCheckbox: boolean;
    disableCheckboxMethod: (tableCell: ITableCellData) => boolean;
}
