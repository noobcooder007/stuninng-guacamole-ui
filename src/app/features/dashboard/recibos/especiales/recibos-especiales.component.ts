import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
    selector: 'app-recibos-especiales',
    standalone: true,
    templateUrl: './recibos-especiales.component.html',
    styleUrl: './recibos-especiales.component.scss',
    imports: [
        CommonModule,
        MatTabsModule,
    ],
})
export class RecibosEspecialesComponent implements OnInit {
    public activeTab: number = 0;
    public sections = [
        { label: 'Reporte Recibos', id: 'reporte' },
        { label: 'Recepción Recibos en Blanco (Proceso)', id: 'recepcion-proceso' },
        { label: 'Recepción Recibos en Blanco', id: 'recepcion' },
        { label: 'Cancelación Recibos', id: 'cancelacion' },
        { label: 'Generación Recibos en Blanco (Proceso)', id: 'generacion-proceso' },
        { label: 'Recibos en Blanco', id: 'recibos-blanco' },
        { label: 'Recibos Especiales', id: 'especiales' }
    ];

    ngOnInit(): void {
        // Lógica de inicialización
    }
}
