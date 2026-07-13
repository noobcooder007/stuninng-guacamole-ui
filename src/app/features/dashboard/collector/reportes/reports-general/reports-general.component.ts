import { Component, OnInit, inject, signal } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import {
  EfficiencyConcentratedType,
  EfficiencyFilter,
  ConcentratedEfficiencyFilter,
  ReportsService,
} from '@app/core/services/reports.service';
import { CollectorListItem, CollectorService } from '@app/core/services/collector.service';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';

@Component({
  selector: 'app-reports-general',
  standalone: true,
  templateUrl: './reports-general.component.html',
  styleUrl: './reports-general.component.scss',
  imports: [
    MatListModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    HasPermissionPipe,
  ],
})
export class ReportsGeneralComponent implements OnInit {
  protected readonly Permissions = Permissions;
  private reportsService = inject(ReportsService);
  private collectorService = inject(CollectorService);

  public selectedReport = 'quantity-difference';
  public isLoading = signal(false);

  public reports = [
    { id: 'quantity-difference',        label: 'Diferencia Cantidades' },
    { id: 'efficiency',                 label: 'Eficiencia' },
    { id: 'concentrated-efficiency',    label: 'Eficiencia Concentrada' },
  ];

  // Meses en formato numérico (1-12), usados por los endpoints con contrato confirmado
  public months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  // Recurrencia en meses, igual que promesas de donación (1=mensual, 2=bimestral, 3=trimestral, 4=cuatrimestral, 6=semestral, 12=anual)
  public efficiencyFrequencies = [
    { value: 1,  label: 'Mensual' },
    { value: 2,  label: 'Bimestral' },
    { value: 3,  label: 'Trimestral' },
    { value: 4,  label: 'Cuatrimestral' },
    { value: 6,  label: 'Semestral' },
    { value: 12, label: 'Anual' },
  ];

  public concentratedEfficiencyTypes: { value: EfficiencyConcentratedType; label: string }[] = [
    { value: 'PERIOD',     label: 'Periodo' },
    { value: 'YEAR',       label: 'Año' },
    { value: 'HISTORICAL', label: 'Histórico' },
  ];

  public currentYear = new Date().getFullYear();
  public years: number[] = [];

  public quantityDifferenceForm = new FormGroup({
    month: new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(12)]),
    year: new FormControl<number | null>(null, [Validators.required, Validators.min(2000)]),
  });

  public efficiencyForm = new FormGroup({
    month: new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(12)]),
    year: new FormControl<number | null>(null, [Validators.required, Validators.min(2000)]),
    initialDonation: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    finalDonation: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    frequency: new FormControl<number | null>(null, Validators.required),
    collectorNum: new FormControl<number | null>(null, Validators.min(1)),
  });

  public concentratedEfficiencyForm = new FormGroup({
    startDate: new FormControl<Date | null>(null, Validators.required),
    endDate: new FormControl<Date | null>(null, Validators.required),
    initialPercentage: new FormControl<number | null>(null, [Validators.required, Validators.min(0), Validators.max(100)]),
    finalPercentage: new FormControl<number | null>(null, [Validators.required, Validators.min(0), Validators.max(100)]),
    efficiencyType: new FormControl<EfficiencyConcentratedType | ''>('', Validators.required),
    collectorNum: new FormControl<number | null>(null, Validators.min(1)),
  });

  public filteredCollectors = signal<CollectorListItem[]>([]);
  public efficiencyCollectorCtrl = new FormControl<CollectorListItem | string | null>('');
  public concentratedCollectorCtrl = new FormControl<CollectorListItem | string | null>('');

  displayCollector = (c: CollectorListItem | string | null) =>
    c && typeof c !== 'string' ? `${c.collectorNumber} - ${c.firstname} ${c.firstLastname} ${c.secondLastname ?? ''}`.trim() : '';

  ngOnInit(): void {
    this.generateYears();
    this.setCurrentValues();

    this.collectorService.getActiveList().subscribe(items => this.filteredCollectors.set(items));
    this.efficiencyCollectorCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(v => this.collectorService.getActiveList(typeof v === 'string' ? v : undefined)),
    ).subscribe(items => this.filteredCollectors.set(items));
    this.concentratedCollectorCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(v => this.collectorService.getActiveList(typeof v === 'string' ? v : undefined)),
    ).subscribe(items => this.filteredCollectors.set(items));
  }

  onEfficiencyCollectorSelected(event: MatAutocompleteSelectedEvent): void {
    const collector = event.option.value as CollectorListItem;
    this.efficiencyForm.patchValue({ collectorNum: collector.collectorNumber });
  }

  clearEfficiencyCollector(): void {
    this.efficiencyCollectorCtrl.setValue('');
    this.efficiencyForm.patchValue({ collectorNum: null });
  }

  onConcentratedCollectorSelected(event: MatAutocompleteSelectedEvent): void {
    const collector = event.option.value as CollectorListItem;
    this.concentratedEfficiencyForm.patchValue({ collectorNum: collector.collectorNumber });
  }

  clearConcentratedCollector(): void {
    this.concentratedCollectorCtrl.setValue('');
    this.concentratedEfficiencyForm.patchValue({ collectorNum: null });
  }

  private generateYears(): void {
    for (let i = this.currentYear - 5; i <= this.currentYear + 5; i++) {
      this.years.push(i);
    }
  }

  private setCurrentValues(): void {
    const currentMonth = new Date().getMonth() + 1;
    this.quantityDifferenceForm.patchValue({ month: currentMonth, year: this.currentYear });
    this.efficiencyForm.patchValue({ month: currentMonth, year: this.currentYear });
  }

  private openBlob(blob: Blob): void {
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  generateQuantityDifferenceReport(): void {
    if (this.quantityDifferenceForm.invalid) return;
    const { month, year } = this.quantityDifferenceForm.getRawValue();
    this.isLoading.set(true);
    this.reportsService.quantityDifferenceReport({ month: month!, year: year! }).subscribe({
      next: (blob) => { this.openBlob(blob); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  generateEfficiencyReport(): void {
    if (this.efficiencyForm.invalid) return;
    const { month, year, initialDonation, finalDonation, frequency, collectorNum } = this.efficiencyForm.getRawValue();
    const payload: EfficiencyFilter = {
      month: month!,
      year: year!,
      initialDonation: initialDonation!,
      finalDonation: finalDonation!,
      frequency: frequency!,
    };
    if (collectorNum) payload.collectorNum = collectorNum;

    this.isLoading.set(true);
    this.reportsService.efficiencyReport(payload).subscribe({
      next: (blob) => { this.openBlob(blob); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  generateConcentratedEfficiencyReport(): void {
    if (this.concentratedEfficiencyForm.invalid) return;
    const { startDate, endDate, initialPercentage, finalPercentage, efficiencyType, collectorNum } =
      this.concentratedEfficiencyForm.getRawValue();
    const payload: ConcentratedEfficiencyFilter = {
      startDate: this.toIsoDate(startDate!),
      endDate: this.toIsoDate(endDate!),
      initialPercentage: initialPercentage!,
      finalPercentage: finalPercentage!,
      efficiencyType: efficiencyType as EfficiencyConcentratedType,
    };
    if (collectorNum) payload.collectorNum = collectorNum;

    this.isLoading.set(true);
    this.reportsService.concentratedEfficiencyReport(payload).subscribe({
      next: (blob) => { this.openBlob(blob); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }
}
