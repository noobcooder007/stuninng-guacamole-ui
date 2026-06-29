import { Component } from '@angular/core';
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
    MatTabsModule,
    ReportsGeneralComponent,
    ReportsBeneficiaryComponent,
    ReportsCollectorComponent,
  ],
})
export class ReportsComponent {
  public activeTab: number = 0;
}
