import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { ReportsGeneralComponent } from './reports-general/reports-general.component';
import { ReportsGrowthComponent } from './reports-growth/reports-growth.component';
import { ReportsEfficiencyConsolidatedComponent } from './reports-efficiency-consolidated/reports-efficiency-consolidated.component';
import { ReportsBeneficientsByCollectorComponent } from './reports-beneficients-by-collector/reports-beneficients-by-collector.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  imports: [
    MatTabsModule,
    ReportsGeneralComponent,
    ReportsGrowthComponent,
    ReportsEfficiencyConsolidatedComponent,
    ReportsBeneficientsByCollectorComponent,
  ],
})
export class ReportsComponent {
  public activeTab: number = 0;
}
