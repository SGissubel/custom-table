// import { Component, OnInit } from '@angular/core';

// @Component({
//   selector: 'app-custom-table',
//   templateUrl: './custom-table.component.html',
//   styleUrls: ['./custom-table.component.scss']
// })
// export class CustomTableComponent implements OnInit {

//   constructor() { }

//   ngOnInit(): void {
//   }

// }




import {
  Component,
  ViewChild,
  Input,
  EventEmitter,
  Output,
  OnDestroy,
  ChangeDetectionStrategy,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { DataSource } from '@angular/cdk/table';
import { MatSort, MatSortable } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
// import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { Observable, of, merge, Subject, Subscription, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import _ from 'lodash';

import { ColumnEditorService } from 'src/app/services/column-editor.service';
import { ITableColumns } from 'src/app/models/table-columns.model';
import { ITableProgressOptions } from 'src/app/models/table-progress-options.model';
import { ITableDataOptions } from 'src/app/models/table-data-options.model';




// export class PageableObservable<T> {
//   protected _observable: BehaviorSubject<T[]> = new BehaviorSubject(null);
//   protected _trigger = new EventEmitter<ITriggerPageParams>();

//   public get observable() {
//     return this._observable;
//   }

//   constructor(public provide: (page: number, pageSize: number) => Observable<PageableData<T>>) {}

//   public trigger(pageNumber?: number, pageSize?: number) {
//     this._trigger.emit({
//       pageNumber,
//       pageSize
//     });
//   }

//   public onTrigger(callback: (params?: ITriggerPageParams) => any): Subscription {
//     return this._trigger.subscribe(callback);
//   }
// }

@Component({
  selector: 'app-custom-table',
  templateUrl: './custom-table.component.html',
  styleUrls: ['./custom-table.component.scss'],
})
export class CustomTableComponent implements OnInit, OnDestroy, AfterViewInit {
  dataSource: TableDataSource | PagedTableDataSource;

  @ViewChild(MatSort) sort: MatSort;

  // Used to import stored column setup
  // tslint:disable-next-line: variable-name
  _columns: ITableColumns[];
  get columns() {
    return this._columns;
  }
  @Input('columns')
  set columns(value) {
    if (value) {
      this._columns = value;
      this.setUpColumns(value);
      this.cdr.detectChanges();
    }
  }
  // Default table layout vs saved configuration
  @Input()
  public defaultTableColumns;

  @Input()
  public pageSizeOptions = [5, 10, 25, 100]; // default

  @Input()
  public defaultPageSize: number;

  @Input()
  public columnFooter: (columnIndex: number, columnData: any[]) => string;

  @Input()
  public useNativeTableLayout: boolean;

  @Input()
  public useMatTablePlusHeader = true;

  // Display excel icon in header (only can be used if the above is true) -- all logic handled here
  @Input()
  public useMatPlusExcel: boolean;

  public showExcelButton = this.useMatPlusExcel;

  // defaulted to true -- controls horizontal scrolling -- shows only if true & table REQUIRES horizontal scrolling
  @Input()
  public showHorizontalScrollButtons = true;

  // table header title
  @Input()
  public resultsName: string;

  // Whether or not to display minimize/maximize button -- defaulted to true inside of table-header component
  @Input()
  public showActions: boolean;

  // Whether or not to use collapse/expand cell text
  @Input()
  public useExpandedColumns: boolean;

  // Whether or not to display minimize/maximize cell text
  expandedColumns: boolean;

  // hide table on page load? defaults to false
  @Input()
  public defaultHiddenTable: boolean;

  // to receive updated list of table data -> after Filter event / after Sorting event
  @Input()
  public useDataListChangedEventEmitter: boolean;

  // to receive updated list of table data -> after Filter event / after Sorting event
  @Input()
  public showTableCellToolTips: boolean;

  @Input()
  public tableContainerClassName: string;

  @Input()
  public dateSpanClass: string;

  @Input()
  public implementSorting: 'none' | 'local' | 'global' = 'none';

  @Input()
  public initialSortActive: ITableOnSortEvent;

  disableMatSort = false;

  @Input()
  public useTableLoadingSpinner: boolean;

  // Progress bar is triggered by the client-side - An extra progress-loader (can-be) used when clicking on a table, and awaiting a new result
  _showProgressBar;
  get showProgressBar() {
    return this._showProgressBar;
  }
  @Input('showProgressBar')
  set showProgressBar(value) {
    if (!value) {
      this._showProgressBar = false;
    } else {
      this._showProgressBar = true;
    }
  }

  // Telling table loading spinner to stop -- can be triggered by client-side
  _dataFinishedLoading;
  get dataFinishedLoading() {
    return this._dataFinishedLoading;
  }
  @Input('dataFinishedLoading')
  set dataFinishedLoading(value) {
    if (!value) {
      this._dataFinishedLoading = false;
      this.displayLoadingSpinner = true;
    } else {
      this._dataFinishedLoading = true;
      if (this.displayLoadingSpinner) {
        // If spinner is showing -- trigger change detection to ensure spinner stops (currently essential for empty tables)
        this.displayLoadingSpinner = false;
        this.cdr.detectChanges();
      } else {
        this.displayLoadingSpinner = false;
      }
    }
  }

  @Input()
  public set dataBehaviorSubject(data: BehaviorSubject<any>) {
    if (this.dataSource != null) {
      this.dataSource.disconnect();
    }
    if (this.dataSub) {
      this.dataSub.unsubscribe();
    }
    if (!data) {
      this.showExcelButton = false;
    } else {
      this.showExcelButton = this.useMatPlusExcel;
      if (this.useDataListChangedEventEmitter) {
        this.dataSource = new TableDataSource(data, this.tableDataOptions, true, this.dataChangeEmitter, this.dataChangeDetector);
      } else {
        this.dataSource = new TableDataSource(data, this.tableDataOptions, false, null, this.dataChangeDetector)
      }
    }
    this.setTableSort();
  }

  @Input()
  public elevate = true;

  @Input()
  public marginX = '0px';

  @Input()
  public marginY = '0px';

  @Input()
  public progressOptions: ITableProgressOptions;

  @Input()
  public showPagination = true;

  // Set to 'true' if you want the table component to handle paginating
  @Input()
  public paginateResults = false;

  // Pass up 'true' if you want to allow table data filtering -- default to false to not affect all projects
  @Input()
  public useResultFiltering = false;

  // Pass up 'true' if you want to allow table editing (column: rearranging/removing/adding) -- default to false to not affect all projects
  @Input()
  public showTableSettingsBtn = false;

  /** Should now ALWAYS be passed up with a table -- created with a Guid */
  @Input()
  public uniqueTableId: string;

  // Will fix the header row & footer paginate row -> for table body scroll
  @Input()
  public fixedHeaderAndFooter: string;

  @Output()
  public paged = new EventEmitter<{ page: number; itemsPerPage: number }>();

  @Output()
  public rowClicked = new EventEmitter<any>();

  @Output()
  public rowButtonClicked = new EventEmitter<any>();

  @Output()
  public saveTableSettings = new EventEmitter<any>();

  @Output()
  public rowChanged = new EventEmitter<any>();

  @Output()
  public dataChangeEmitter = new EventEmitter<any>();

  public showFilter = false;

  public get paginate() {
    // tslint:disable-next-line: no-use-before-declare
    return (
      this.dataSource != null &&
      this.dataSource instanceof PagedTableDataSource &&
      this.showPagination
    );
  }

  public get filtering() {
    return this.dataSource != null && this.useResultFiltering;
  }

  // To paginate and sort within this table component instead of using the PagedTableDataSource
  public get paginate2() {
    return this.dataSource != null && this.paginateResults;
  }

  public get pagedDataSource() {
    return this.dataSource;
  }

  private dataSub: Subscription;
  private sortSub: Subscription;
  public columnFooters = [];
  private _emptyColumnNames = [];
  private _columnNames: string[] = [];
  private _lastColumns: any;

  private tableDataOptions: ITableDataOptions = {
    filter: this.useResultFiltering,
    paginate: this.paginateResults
  };

  displayLoadingSpinner: boolean;

  public get columnNames(): string[] {
    if (this.columns == null) {
      return this._emptyColumnNames;
    }
    if (this.columns.length !== this._columnNames.length || this.columns !== this._lastColumns) {
      this._columnNames = this.columns.map(c => c.field);
    }
    return this._columnNames;
  }

  public dataChangeDetector = () => {
    this.dataFinishedLoading = true;
  }

  public trackByFn = (index, item) => {
    return item.id; // unique id corresponding to the item
  }

  constructor(
    private columnEditorService: ColumnEditorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.displayLoadingSpinner = true;
    this.columnsEditorSubscription()
  }

  setUpColumns(columns) {
    if (this.columnFooter && this.columns) {
      this.setColumnFooter();
    }
    if (this.showTableSettingsBtn && this.columns && this.columns.length && columns && columns.length) {
      if (!this.uniqueTableId) {
        console.error('In order to properly use table editing/settings,\n it is recommended that you ALWAYS also provide a unique GUID (passed up as "uniqueTableId") for each table using the Table Editing/Settings! \n Visit https://www.guidgenerator.com/online-guid-generator.aspx to generate the GUID\'s that you need')
      }

      columns.forEach((col: ITableColumns, index) => {
        const defaultColumnIndex = this.defaultTableColumns.findIndex(defaultColumn => defaultColumn.field === col.field);
        if (defaultColumnIndex === -1) { // safeguard if column field has changed
          this.resetTable();
        } else {
          // adding in all properties/methods not stored in save -- preventatively ensuring any properties updated in project will update for saved tables:
          const objectProperties = [];
          for (const key in this.defaultTableColumns[defaultColumnIndex]) {
            if (key !== 'field' && key !== 'displayField') {
              objectProperties.push(key);
            }
          }
          objectProperties.forEach(property => {
            col[property] = this.defaultTableColumns[defaultColumnIndex][property]
          });
          // from saved sorted column
          if (col.sortOn) {
            this.sort.sort(({ id: col.field, start: col.sortDirection}) as MatSortable);
          }
          return col;
        }
      });
    }
  }

  resetTable() {
    const tableColData = {
      saveType: TableSettingsSaveType.Reset,
      columns: this.defaultTableColumns,
      tableId: this.uniqueTableId,
      resetTable: true
    }
    this.columnEditorService.setColumns(tableColData);
  }

  columnsEditorSubscription() {
    this.columnEditorService.getUpdatedColumns().subscribe((res: ITableSettingsUpdate) => {
      // to separate settings - ensuring unique settings for each table - subscription tests against unique id before applying settings
      if (res.tableId === this.uniqueTableId) {
        this.columns = res.columns;
        if (this.columnFooter) {
          this.setColumnFooter();
        }
        if (res.saveType === TableSettingsSaveType.Save || res.saveType === TableSettingsSaveType.Reset) {
          if (this.dataSource._sort.direction) {
            res.columns.forEach(column => {
              if (column.field === this.dataSource._sort.active) {
                column.sortOn = true;
                column.sortDirection = this.dataSource._sort.direction;
              } else {
                column.sortOn = false;
                column.sortDirection = null;
              }
            })
          }
          const tableSettings: ITableSettingsSave = {
            columns: res.columns,
            tableGuid: res.tableId,
            saveType: res.saveType,
            resetTable: res.resetTable
          };
          this.saveTableSettings.emit(tableSettings);
        }

        this.dataSource.update();
      }
    });
  }

  getPageHeight() {
    return window.innerHeight - 250;
  }

  public getContainerClasses(column) {
    if (this.useExpandedColumns) {
      if (column.type === TableColumnType.CustomButton) {
        return this.expandedColumns ? 'expand-button-text expand-text' : 'collapse-button-text';
      } else {
        return this.expandedColumns ? 'expand-text' : 'collapse-text';
      }
    }
  }

  setColumnFooter() {
    this.dataSub = this.dataSource.dataSubject.subscribe(results => {
      if (results && results.length > 0) {
        this.columnFooters = [];
        if (this.showTableSettingsBtn) {
          this.columns[0].notEditable = true;
        }
        this.columns.forEach((column, index) => {
          this.columnFooters[index] = this.columnFooter(
            index,
            results.map(value => value[column.field])
          );
        });
      }
    });
  }

  ngAfterViewInit() {
    if (this.implementSorting !== 'none') {
      // initialize sorting
      this.setTableSort();
    } else {
      this.disableMatSort = true;
      // hide unused dropdown arrows
      const materialSortArrows = document.querySelectorAll('.mat-sort-header-arrow');
      [].forEach.call(materialSortArrows, arrow => {
        arrow.style.visibility = 'hidden';
      });
    }

    this.setFilterAndPagination();
  }

  setFilterAndPagination() {
    this.tableDataOptions = {
      filter: this.useResultFiltering,
      paginate: this.paginateResults
    };
    if (this.useResultFiltering) {
      this.dataSource.filter = true;
    }

    if (this.paginateResults) {
      this.defaultPageSize = this.defaultPageSize || this.pageSizeOptions[0];
      this.dataSource.page = 0;
      this.dataSource.pageSize = this.defaultPageSize;
      this.dataSource.paginate = true;
      this.dataSource.update();
    }
  }

  ngOnDestroy() {
    if (this.dataSource != null) {
      this.dataSource.disconnect();
    }
    if (this.dataSub) {
      this.dataSub.unsubscribe();
    }
    if (this.sortSub) {
      this.sortSub.unsubscribe();
    }
  }

  private setTableSort() {
    if (this.sortSub != null) {
      this.sortSub.unsubscribe();
    }
    if (this.sort) {
      this.sortSub = this.sort.sortChange.subscribe(event => {
        this.dataSource.updateSort();
      });
      this.dataSource._sort = this.sort;
    }
  }

  onRowClicked(row: any) {
    this.rowClicked.emit(row);
  }

  onCellClicked(row: any, fieldValue, field) {
    const rowButtonClick = {
      row,
      fieldValue,
      field
    };
    this.rowButtonClicked.emit(rowButtonClick);
  }

  cellRouteFor(cellColumnIndex, cellRowIndex, cellData, cellRow): ITableCellRoute {
    const column = this.columns[cellColumnIndex];
    return (
      column.route &&
      column.route({
        columnIndex: cellColumnIndex,
        rowIndex: cellRowIndex,
        data: cellData,
        row: cellRow
      })
    );
  }

  showToolTip(column, row) {
    if (this.expandedColumns) {
      return null;
    }
     if (!this.showTableCellToolTips || column.hideToolTip) {
       return null;
     } else {
      return column.transform ? column.transform(row) : row[column.field];
     }
  }

  onRowChanged(row: any) {
    this.rowChanged.emit(row);
  }

  // allows html to be passed into row
  // "replace" allows dev-created strings to be replaced with the object[data] - "nested" allows 1 level deeper nested[object][data]
  sanitize(column, row): SafeHtml {
    const customHtml = {
      html: column.customHTML.html,
      replaceItems: ''
    };

    if (column.replace) {
      // allows an array of data - unknown length - dynamically generate html
      if (column.dynamicHtml) {
        // required attr's - html(ex: <div class="...">) / htmlClose(ex: </div><script></script>) / tagType(ex: div/span/p/etc)
        const dynamicHtml = column.customHTML;
        let innerHtmlStr = '';

        row[column.field].map(item => {
          let curHtmlStr = `<${dynamicHtml.tagType}`;
          // classes and dynamically generated classes (classNameAdd) can be added but are not required
          if (dynamicHtml.classNameAdd) {
            curHtmlStr += ` class="${dynamicHtml.tagClassName}${item[dynamicHtml.classNameAdd]}">`;
          } else if (dynamicHtml.tagClassName && !dynamicHtml.classNameAdd) {
            curHtmlStr += ` class="${row[dynamicHtml.tagClassName]}">`;
          } else {
            curHtmlStr += '>';
          }
          if (dynamicHtml.toolTip) {
            // all styling will be accomplished locally - sans display: none - parent requires 'position: relative;'
            // tslint:disable-next-line:max-line-length
            curHtmlStr += `<span style="display: none;" class="${dynamicHtml.toolTipClass}">${
              item[dynamicHtml.toolTip]
            }</span>${item[dynamicHtml.display]}</${dynamicHtml.tagType}>`;
            innerHtmlStr += curHtmlStr;
          } else {
            curHtmlStr += `${curHtmlStr}</span>${item[dynamicHtml.display]}</${
              dynamicHtml.tagType
            }>`;
            innerHtmlStr += curHtmlStr;
          }
        });
        customHtml.html = `${dynamicHtml.html}${innerHtmlStr}${dynamicHtml.htmlClose}`;
      } else {
        customHtml.replaceItems = column.customHTML.replaceItems;

        for (let key of Object.keys(customHtml.replaceItems)) {
          let item = customHtml.replaceItems[key];
          if (column.nested) {
            customHtml.html = customHtml.html.replace(
              item.replaceItem,
              row[item.withParent][item.withItem]
            );
          } else {
            customHtml.html = customHtml.html.replace(item.replaceItem, row[item.withItem]);
          }
        }
      }
    }
    return this._sanitizer.bypassSecurityTrustHtml(customHtml.html);
  }

  disableCheckbox(column, row) {
    if (column.disableCheckboxMethod) {
      return column.disableCheckboxMethod(row);
    }
  }

  disableButton(column, row) {
    if (column.disableCustomButtonMethod) {
      return column.disableCustomButtonMethod(row);
    }
  }

  getPaddedComp(comp) {
    return parseInt(comp, 10) < 10 ? '0' + comp : comp;
  }

  getHoursFromDate(date) {
    const hh = date.getHours();
    let min = date.getUTCMinutes();
    let hours;
    let amPm;
    if (hh > 12) {
      hours = hh - 12;
      amPm = 'PM';
    } else if (hh === 12) {
      hours = hh;
      amPm = 'PM';
    } else {
      hours = hh;
      amPm = 'AM';
    }
    min = this.getPaddedComp(min);
    hours = this.getPaddedComp(hours);
    const time = ` - ${hours}:${min}${amPm}`;
    return time;
  }

  dateType(column, row) {
    if (row[column.field]) {
      return this.setDate(column, row);
    } else {
      // return empty string if no value
      return '';
    }
  }

  setDate(column, row) {
    const date = new Date(row[column.field]);
    let yyyy = date.getUTCFullYear().toString();
    let mm = date.getMonth() + 1;
    let fullDate;
    const dateType = column.dateType;

    if (isNaN(mm)) { // added check to return possible non-date-format string values: ex -> '12/12/1999;01/4/1980'
      return row[column.field];
    }
    if (!dateType.fullYear) {
      yyyy = yyyy.slice(2);
    }
    if (dateType.day) {
      let dd;
      if (dateType.withoutTime) { // for Zulu time - where time is: 00:00:00.000
        dd = date.getUTCDate();
        mm = date.getUTCMonth() + 1;
        mm = this.getPaddedComp(mm);
      } else {
        dd = date.getDate();
        mm = this.getPaddedComp(mm);
      }
      dd = this.getPaddedComp(dd);

      fullDate = `${mm}/${dd}/${yyyy}`;
    } else {
      fullDate = `${mm}/${yyyy}`;
    }
    if (dateType.time && !dateType.withoutTime) {
      const hours = this.getHoursFromDate(date);
      fullDate += hours;
    }

    return fullDate;
  }

  dateToolTip(column, row) {
    const rowDate = row[column.field];
    const date = new Date(rowDate);
    const dateWithoutTime = date.toDateString();
    let hours;
    let fullDate;
    // for utc dates with no set time (day is always one day behind)
    if (column.dateType.withoutTime) {
      const addDays = startDate => {
        // need to separate then re-form date to add day
        const returnDate = new Date(
          startDate.getFullYear(),
          startDate.getUTCMonth(),
          startDate.getUTCDate(),
          startDate.getHours(),
          startDate.getMinutes(),
          startDate.getSeconds()
        );
        return returnDate;
      };
      const curDate = new Date(rowDate);
      const datePlusDay = addDays(curDate);
      fullDate = datePlusDay.toDateString();
    } else {
      hours = this.getHoursFromDate(date);

      fullDate = `${dateWithoutTime} - ${hours}`;
    }

    return fullDate;
  }

  columnReadonly(column: any) {
    return column.type == null || column.type === TableColumnType.ReadonlyText;
  }

  columnCheckbox(column: any) {
    return column.type === TableColumnType.Checkbox;
  }

  columnCellImage(column: any) {
    // imgAltText -> not required - image alt text
    // cellImageSrc -> required column value -- takes in base64 image string
    return column.type === TableColumnType.CellImage;
  }

  columnDate(column: any) {
    return column.type === TableColumnType.Date;
  }

  columnDateType(column: any) {
    return column.type === TableColumnType.DateType;
  }

  columnCustomButton(column: any) {
    return column.type === TableColumnType.CustomButton;
  }
}

export class TableDataSource extends DataSource<any> {
  public paginate = false;
  public filter = false;
  public _page = 0;
  public _pageSize = 10;
  public totalItems = 0;
  public filterValue = '';

  public tableData: any[];

  protected updateSubject = new Subject<any>();

  dataSubject = new BehaviorSubject<any[]>(null);
  dataObserved = new BehaviorSubject<boolean>(false);
  _sort: MatSort;

  public set page(page: number) {
    this._page = page;
    this.update();
  }

  public get page() {
    return this._page;
  }

  public set pageSize(itemsPerPage: number) {
    this._pageSize = itemsPerPage;
    this.update();
  }

  public get pageSize() {
    return this._pageSize;
  }

  constructor(
    protected dataObservable,
    private tableDataOptions?: ITableDataOptions,
    private useEventEmitterMethod?,
    private emitMethod?,
    private changeDetector?: Function
  ) {
    super();
    if (this.tableDataOptions.filter) {
      this.filter = this.tableDataOptions.filter;
    } else {
      this.filter = false;
    }
    if (this.tableDataOptions.paginate) {
      this.paginate = this.tableDataOptions.paginate;
    } else {
      this.paginate = false;
    }
  }

  paged(event: PageEvent) {
    this._page = event.pageIndex;
    this._pageSize = event.pageSize;
    this.updateSubject.next();
  }

  update() {
    this.updateSubject.next();
  }

  applyFilter(event: Event) {
    if (this._page !== 0) {
      this._page = 0;
    }
    this.filterValue = (event.target as HTMLInputElement).value;
    this.updateSubject.next();
  }

  updateSort() {
    this.updateSubject.next();
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<any> {
    const dataChanges = [this.updateSubject, this.dataObservable];
    return merge(...dataChanges).pipe(
      map((data: any[]) => {
        if (data) {
          this.tableData = data;
          this.changeDetector();
        }
        if (this._sort) {
          data = this.sortData(this.tableData);
          if (this.useEventEmitterMethod) {
            this.emitMethod.emit(data)
          }
        }
        if (this.filter && this.paginate && this.tableData && this.tableData.length) {
          const filteredData = this.filterData(this.tableData);
          if (this.useEventEmitterMethod) {
            this.emitMethod.emit(filteredData)
          }
          this.totalItems = filteredData.length;
          data = this.setPagination(filteredData);
        } else if (this.filter && !this.paginate && this.tableData && this.tableData.length) {
          data = this.filterData(this.tableData);
          if (this.useEventEmitterMethod) {
            this.emitMethod.emit(data)
          }
        } else if (!this.filter && this.paginate && this.tableData) {
          this.totalItems = this.tableData.length;
          data = this.setPagination(this.tableData);
        }

        this.dataObserved.next(true);
        this.dataSubject.next(this.tableData);

        return data;
      })
    );
  }

  filterData(data: any[]) {
    const filterArray = this.filterValue.split(' ');
    let filteredData = data;
    
    if (!filterArray.length) {
      return data;
    }

    filterArray.forEach((filter, index) => {
      filter = filter.toUpperCase();
      filteredData = filteredData.filter(item => {
        const values = Object.values(item);
        let containsFilter;

        values.forEach(value => {
          if (value && value.toString().toUpperCase().includes(filter)) {
            containsFilter = true;
          }
        });
        if (containsFilter) {
          return item;
        }
      })
    });

    return filteredData;
  }

  disconnect() {}

  /** Returns a sorted copy of the database data. */
  sortData(data: any[]) {
    if (!this._sort.active || this._sort.direction === '') {
      return data;
    }
    const dateRegex = /^(0?[1-9]|1[0-2])\/(0?[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/;
    return data.sort((a, b) => {
      let propertyA: number | string = '';
      let propertyB: number | string = '';
      const property = this._sort.active;
      propertyA = a[property];
      propertyB = b[property];

      if (propertyA == null || propertyA === '') {
        return this._sort.direction === 'asc' ? 1 : -1;
      }
      if (propertyB == null || propertyB === '') {
        return this._sort.direction === 'asc' ? -1 : 1;
      }

      const valueA = isNaN(+propertyA) ? propertyA.toString().toLowerCase() : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB.toString().toLowerCase() : +propertyB;

      if (
        typeof valueA === 'string' &&
        typeof valueB === 'string' &&
        dateRegex.test(valueA) &&
        dateRegex.test(valueB)
      ) {
        return (
          (Date.parse(valueA) < Date.parse(valueB) ? -1 : 1) *
          (this._sort.direction === 'asc' ? 1 : -1)
        );
      }

      return (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
    });
  }

  setPagination(data: any[]): any[] {
    let newResultsPage;
    if (this._page !== 0) {
      const start = this._page * this._pageSize;
      const end = start + this._pageSize;
      newResultsPage = data.slice(start, end);
    } else {
      const end = this._pageSize;
      newResultsPage = data.slice(0, end);
    }

    return newResultsPage;
  }
}

export class PagedTableDataSource extends TableDataSource {
  private currentProvidedObservable: Observable<any>;
  private triggerSub: Subscription;
  private observableSub: Subscription;

  private initialSortDone: boolean;

  public pages = 0;
  public onGlobalSort: EventEmitter<ITableOnSortEvent>;

  constructor(
    private pageableObservable,
    pageSize,
    onGlobalSort: EventEmitter<ITableOnSortEvent>
  ) {
    super(pageableObservable.observable);
    this._pageSize = pageSize;
    this.onGlobalSort = onGlobalSort;
    this.triggerSub = this.pageableObservable.onTrigger((params: ITriggerPageParams) => {
      this._page = params.pageNumber === undefined ? this._page : params.pageNumber;
      this._pageSize = params.pageSize === undefined ? this._pageSize : params.pageSize;
      this.update();
    });
    this.update();
  }

  paged(event: PageEvent) {
    this._page = event.pageIndex;
    this._pageSize = event.pageSize;
    this.update();
  }

  update() {
    this.dataObserved.next(false);
    const providedObservable = this.pageableObservable.provide(this.page + 1, this.pageSize);
    // if someone is using a hot observable this avoids subscribing multiple times.
    if (this.dataObservable === this.currentProvidedObservable) {
      return;
    }
    if (this.observableSub != null) {
      this.observableSub.unsubscribe();
    }
    this.currentProvidedObservable = providedObservable;
    if (this.currentProvidedObservable == null) {
      return;
    }
    this.observableSub = this.currentProvidedObservable.subscribe((response: PageableData<any>) => {
      this.dataObserved.next(true);
      this.dataSubject.next(response.results);
      if (response == null || response.results == null || response.results.length === 0) {
        this.totalItems = 0;
        this.pages = 0;
        this.pageableObservable.observable.next(null);
        return;
      }
      this.totalItems = response.totalResults;
      this.pages = response.totalResults / this.pageSize;
      if (this._sort && !this.onGlobalSort) {
        this.sortData(response.results);
      }

      this.initialSortDone = false;
      this.pageableObservable.observable.next(response.results);
    });
  }

  updateSort() {
    if (this.onGlobalSort) {
      if (!this.initialSortDone) {
        this.onGlobalSort.emit({
          active: this._sort.active,
          direction: this._sort.direction
        });
      }
    } else {
      this.update();
    }
    this.initialSortDone = true;
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<any> {
    return this.dataObservable.pipe(map((data: any[]) => data));
  }

  disconnect() {
    if (this.triggerSub != null) {
      this.triggerSub.unsubscribe();
    }
    if (this.observableSub != null) {
      this.observableSub.unsubscribe();
    }
  }
}
