import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ProcessesService } from '@app/core/services/processes.service';

@Component({
  selector: 'app-processes',
  standalone: true,
  templateUrl: './processes.component.html',
  styleUrl: './processes.component.scss',
  imports: [
    CommonModule,
    MatTabsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    ReactiveFormsModule,
  ],
})
export class ProcessesComponent implements OnInit {
  private processesService = inject(ProcessesService);

  public activeTab: number = 0;
  public isProcessing = false;
  public currentYear = new Date().getFullYear();
  public years: number[] = [];

  public months = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  public commissionForm = new FormGroup({
    month: new FormControl(''),
    year: new FormControl<number | string>(''),
  });

  public receiptsForm = new FormGroup({
    month: new FormControl(''),
  });

  ngOnInit(): void {
    this.generateYears();
    this.setCurrentMonth();
  }

  private generateYears(): void {
    for (let i = this.currentYear - 5; i <= this.currentYear + 5; i++) {
      this.years.push(i);
    }
  }

  private setCurrentMonth(): void {
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    this.commissionForm.patchValue({ month: currentMonth, year: this.currentYear.toString() });
    this.receiptsForm.patchValue({ month: currentMonth });
  }

  startCommissionProcess(): void {
    if (this.commissionForm.invalid) {
      return;
    }

    this.isProcessing = true;
    const request = {
      month: this.commissionForm.get('month')?.value || '',
      year: this.commissionForm.get('year')?.value?.toString(),
    };

    this.processesService.startCommissionProcess(request).subscribe({
      next: (response) => {
        console.log('Proceso iniciado:', response);
        this.isProcessing = false;
        // TODO: Mostrar notificación de éxito
      },
      error: (error) => {
        console.error('Error iniciando proceso:', error);
        this.isProcessing = false;
        // TODO: Mostrar notificación de error
      },
    });
  }

  startReceiptsGenerationProcess(): void {
    if (this.receiptsForm.invalid) {
      return;
    }

    this.isProcessing = true;
    const request = {
      month: this.receiptsForm.get('month')?.value || '',
    };

    this.processesService.startReceiptsGenerationProcess(request).subscribe({
      next: (response) => {
        console.log('Proceso iniciado:', response);
        this.isProcessing = false;
        // TODO: Mostrar notificación de éxito
      },
      error: (error) => {
        console.error('Error iniciando proceso:', error);
        this.isProcessing = false;
        // TODO: Mostrar notificación de error
      },
    });
  }
}
