import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
    selector: 'app-impresion-recibos',
    standalone: true,
    templateUrl: './impresion-recibos.component.html',
    styleUrl: './impresion-recibos.component.scss',
    imports: [
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
    ],
})
export class ImpresionRecibosComponent implements OnInit {
    private http = inject(HttpClient);

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

    public years = Array.from({ length: new Date().getFullYear() - 2000 + 1 }, (_, index) => {
        const year = 2000 + index;
        return { value: String(year), label: String(year) };
    });

    public filters: {
        month?: string | null;
        year?: string | null;
        nombre?: string | null;
        apellidoPaterno?: string | null;
        apellidoMaterno?: string | null;
        numeroColector?: string | null;
        folioInicio?: string | null;
        folioFinal?: string | null;
    } = {
        month: null,
        year: null,
        nombre: null,
        apellidoPaterno: null,
        apellidoMaterno: null,
        numeroColector: null,
        folioInicio: null,
        folioFinal: null,
    };

    ngOnInit(): void {}

    printRecibos(): void {
        this.downloadReceiptPdf('imprimir', 'Imprimir_Recibos.pdf');
    }

    printCartaRecibosActual(): void {
        this.downloadReceiptPdf('carta-actual', 'Carta_Recibos_Actual.pdf');
    }

    printCartaRecibosAnterior(): void {
        this.downloadReceiptPdf('carta-anterior', 'Carta_Recibos_Anterior.pdf');
    }

    private downloadReceiptPdf(type: string, filename: string): void {
        const endpoint = `/api/recibos/impresion/${type}`;
        const payload = {
            month: this.filters.month,
            year: this.filters.year,
            nombre: this.filters.nombre,
            apellidoPaterno: this.filters.apellidoPaterno,
            apellidoMaterno: this.filters.apellidoMaterno,
            numeroColector: this.filters.numeroColector,
            folioInicio: this.filters.folioInicio,
            folioFinal: this.filters.folioFinal,
        };

        this.http.post(endpoint, payload, { responseType: 'blob' }).subscribe({
            next: (blob) => this.downloadPdf(blob, filename),
            error: (error) => {
                console.error('Error descargando PDF de recibos:', error);
            },
        });
    }

    private downloadPdf(blob: Blob, filename: string): void {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    }
}
