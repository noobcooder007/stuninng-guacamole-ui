import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
    selector: 'app-impresion-recibos',
    standalone: true,
    templateUrl: './impresion-recibos.component.html',
    styleUrl: './impresion-recibos.component.scss',
    imports: [
        CommonModule,
        MatTabsModule,
    ],
})
export class ImpresionRecibosComponent implements OnInit {
    public activeTab: number = 0;
    public sections = [
        { label: 'Carta Recibos Anterior', id: 'carta-anterior' },
        { label: 'Carta Recibos Actual', id: 'carta-actual' },
        { label: 'Imprimir Recibos', id: 'imprimir' },
        { label: 'Impresión de Recibos', id: 'impresion' }
    ];

    ngOnInit(): void {
        // Lógica de inicialización
    }
}
