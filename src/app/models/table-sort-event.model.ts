import { SortDirection } from '@angular/material/sort';

export interface ITableOnSortEvent {
    active: string;
    direction: SortDirection;
}
