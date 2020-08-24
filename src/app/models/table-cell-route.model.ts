export interface ITableCellRoute {
    externalLink?: boolean;
    route: string;
    queryParams?: any;
    queryParamsHandling?: string;
    skipLocationChange?: boolean;
}
