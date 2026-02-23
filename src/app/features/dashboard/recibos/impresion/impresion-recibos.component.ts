import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
    selector: 'app-impresion-recibos',
    standalone: true,
    templateUrl: './impresion-recibos.component.html',
    styleUrls: ['./impresion-recibos.component.scss'],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
    ],
})
export class ImpresionRecibosComponent implements OnInit {
    recibosForm = new FormGroup({
        mes: new FormControl(''),
        folioInicial: new FormControl(''),
        folioFinal: new FormControl(''),
        nombre: new FormControl(''),
        apPaterno: new FormControl(''),
        apMaterno: new FormControl(''),
        noColector: new FormControl(''),
        codigoPostal: new FormControl(''),
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

    ngOnInit() {
        const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
        this.recibosForm.patchValue({
            mes: currentMonth,
        });
    }

    imprimirRecibos() {
        console.log('Imprimir Recibos:', this.recibosForm.value);
        // TODO: Implementar impresión
    }

    cartaRecibosActual() {
        console.log('Carta de Recibos Actual:', this.recibosForm.value);
        // TODO: Implementar carta actual
    }

    cartaRecibosAnterior() {
        console.log('Carta de Recibos Anterior:', this.recibosForm.value);
        // TODO: Implementar carta anterior
    }
}
