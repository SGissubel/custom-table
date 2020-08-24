import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ColumnEditorService {
    columnsEdit = new BehaviorSubject<any>(null);

    constructor() { }

    setColumns(columns) {
        this.columnsEdit.next(columns);
    }

    getUpdatedColumns() {
        return this.columnsEdit.asObservable();
    }
}
