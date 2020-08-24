import { ITableCellData } from './table-cell-data.model';
import { ITableCellRoute } from './table-cell-route.model';
import { ITableCellCheckBox } from './table-cell-checkbox.model';
import { ITableCellCustomButton } from './table-cell-custom-button.model';

export interface ITableColumns {
    field: string;
    displayField: string;
    hideToolTip?: boolean;
    stickyColumn?: boolean;
    notEditable?: boolean;
    sortOn?: boolean;
    sortDirection?: string;
    type?: number;
    hideColumn?: boolean;
    headerCellClasses?: string[];
    cellClasses?: (tableCell) => string;
    transform?: (tableCell) => string;
    route?: (tableCell: ITableCellData) => ITableCellRoute;
    disableCheckboxMethod?: (tableCell) => ITableCellCheckBox;
    disableCustomButtonMethod?: (tableCell) => ITableCellCustomButton;
}
