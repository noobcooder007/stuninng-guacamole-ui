import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
    selector: 'colector-reportes',
    templateUrl: './colector-reportes.component.html',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatTabsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
    ],
})
export class ColectorReportesComponent implements OnInit {
    // Tab 1: Reporte Liquidación
    reporteLiquidacionForm = new FormGroup({
        mes: new FormControl(''),
        anio: new FormControl(''),
        tipoReporte: new FormControl(''),
        noColector: new FormControl(''),
    });

    // Tab 2: Reporte Comisión
    reporteComisionForm = new FormGroup({
        mes: new FormControl(''),
        anio: new FormControl(''),
        nombre: new FormControl(''),
        apPaterno: new FormControl(''),
        apMaterno: new FormControl(''),
        noColector: new FormControl(''),
    });

    meses = [
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

    anios = Array.from({ length: 10 }, (_, i) => {
        const year = new Date().getFullYear() - i;
        return { value: year.toString(), label: year.toString() };
    });

    tiposReporte = [
        { value: 'detallado', label: 'Detallado' },
        { value: 'resumido', label: 'Resumido' },
        { value: 'completo', label: 'Completo' },
    ];

    ngOnInit() {
        // Inicializar valores por defecto
        const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const currentYear = new Date().getFullYear().toString();

        this.reporteLiquidacionForm.patchValue({
            mes: currentMonth,
            anio: currentYear,
        });

        this.reporteComisionForm.patchValue({
            mes: currentMonth,
            anio: currentYear,
        });
    }

    imprimirLiquidacion() {
        console.log('Imprimir Liquidación:', this.reporteLiquidacionForm.value);
        // TODO: Implementar impresión
    }

    imprimirComision() {
        console.log('Imprimir Comisión:', this.reporteComisionForm.value);
        // TODO: Implementar impresión
    }
}
