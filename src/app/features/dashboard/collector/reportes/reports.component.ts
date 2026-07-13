import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { ReportsGeneralComponent } from './reports-general/reports-general.component';
import { ReportsGrowthComponent } from './reports-growth/reports-growth.component';
import { ReportsEfficiencyConsolidatedComponent } from './reports-efficiency-consolidated/reports-efficiency-consolidated.component';

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
  ],
})
export class ReportsComponent {
  public activeTab: number = 0;
}
