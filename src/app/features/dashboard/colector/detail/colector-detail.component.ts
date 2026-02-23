import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ColectorService, Colector } from '@app/core/services/colector.service';
import { ColectorDetailService } from '@app/core/services/colector-detail.service';

@Component({
    selector: 'app-colector-detail',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTabsModule,
        MatDialogModule,
    ],
    templateUrl: './colector-detail.component.html',
    styleUrls: ['./colector-detail.component.scss'],
})
export class ColectorDetailComponent implements OnInit {
    private colectorService = inject(ColectorService);
    private colectorDetailService = inject(ColectorDetailService);
    readonly dialogRef = inject(MatDialogRef<ColectorDetailComponent>);

    colector: any;

    ngOnInit() {
        this.colector = this.colectorDetailService.getColector() || this.getMockData();
    }

    getMockData() {
        return {
            id: 1,
            noColector: 'C001',
            nombre: 'Juan',
            apPaterno: 'García',
            apMaterno: 'López',
            rfc: 'GARL800101XXX',
            numeroSeguroSocial: '123456789',
            activo: true,
            calle: 'Calle Principal',
            colonia: 'Centro',
            delegacionMunicipio: 'Centro',
            poblacionCiudad: 'Madrid',
            codigoPostal: '28001',
            entidadFederativa: 'Madrid',
            telefono: '555-0001',
            celular: '555-0002',
            email: 'juan@example.com',
            porcentajeComision: 5.5,
            contactoEmergente: 'María García',
            referenciaBancaria: 'BANCO123456',
            referencia: 'Referencia-001',
            observaciones: 'Colector confiable',
        };
    }

    goBack() {
        this.dialogRef.close();
    }

    editColector() {
        if (!this.colector || !this.colector.id) {
            console.error('No hay colector para editar');
            return;
        }
        console.log('Editar colector:', this.colector);
        // TODO: Implementar dialog de edición
    }
}
