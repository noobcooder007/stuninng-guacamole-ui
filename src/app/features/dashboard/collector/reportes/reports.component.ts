import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { ReportsGeneralComponent } from './reports-general/reports-general.component';
import { ReportsBeneficiaryComponent } from './reports-beneficiary/reports-beneficiary.component';
import { ReportsCollectorComponent } from './reports-collector/reports-collector.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  imports: [
    CommonModule,
    MatTabsModule,
    ReportsGeneralComponent,
    ReportsBeneficiaryComponent,
    ReportsCollectorComponent,
  ],
})
export class ReportsComponent implements OnInit {
  public activeTab: number = 0;

  ngOnInit(): void {
    // Lógica de inicialización
  }
}
