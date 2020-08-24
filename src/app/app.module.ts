import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { CustomTableComponent } from './components/custom-table/custom-table.component';
import { MaterialModule } from './material.module';
import { TableHeaderComponent } from './components/table-header/table-header.component';


@NgModule({
  declarations: [
    AppComponent,
    CustomTableComponent,
    TableHeaderComponent
  ],
  imports: [
    BrowserModule,
    MaterialModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
