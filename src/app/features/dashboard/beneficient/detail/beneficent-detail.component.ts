import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { BeneficientService, Beneficent } from '@app/core/services/beneficent.service';
import { BeneficientDetailService } from '@app/core/services/beneficent-detail.service';

@Component({
    selector: 'app-beneficent-detail',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatTabsModule,
        MatDialogModule,
    ],
    templateUrl: './beneficent-detail.component.html',
    styleUrls: ['./beneficent-detail.component.scss'],
})
export class BeneficientDetailComponent implements OnInit {
    private beneficientService = inject(BeneficientService);
    private beneficientDetailService = inject(BeneficientDetailService);
    readonly dialogRef = inject(MatDialogRef<BeneficientDetailComponent>);

    beneficent: any;

    ngOnInit() {
        // Obtener los datos del servicio
        this.beneficent = this.beneficientDetailService.getBeneficent() || this.getMockData();
    }

    getMockData() {
        // Datos por defecto si no hay datos seleccionados
        return {
            id: '1',
            noBienhechor: 'B001',
            tipoPersona: 'Jurídica',
            genero: 'Masculino',
            nombre: 'Juan García López',
            apPaterno: 'García',
            apMaterno: 'López',
            razonSocial: 'García López SRL',
            email: 'juan@example.com',
            fechaAlta: '2023-01-15',
            causaAlta: 'Donación Regular',
            fechaNacimiento: '1980-05-20',
            edoCivil: 'Casado',
            rfc: 'GARL800101XXX',
            activo: true,
            donativo: '$5,000.00',
            frecuencia: 'Mensual',
            saldo: '$2,500.00',
            diaPago: '15',
            fechaUltimoDonativo: '2024-02-10',
            tipoDonativo: 'Monetario',
            calle: 'Calle Principal',
            numeroExterior: '123',
            numeroInterior: 'Apto 4B',
            colonia: 'Centro',
            cp: '28001',
            localidad: 'Madrid',
            ciudad: 'Madrid',
            delegacionMunicipio: 'Centro',
            telefono1: '555-0001',
            telefono2: '555-0002',
            whatsapp: '555-0003',
            entidadFederativa: 'Madrid',
            observaciones: 'Cliente frecuente, muy puntual en sus donaciones.',
            fechaObservacion: '2024-02-10',
            colectores: [
                { id: 1, nombre: 'Colector 1' },
                { id: 2, nombre: 'Colector 2' },
            ],
        };
    }

    goBack() {
        // Cerrar el dialog
        this.dialogRef.close();
    }

    assignCollector() {
        console.log('Asignar colector');
    }

    editBeneficent() {
        if (!this.beneficent || !this.beneficent.id) {
            console.error('No hay beneficiente para editar');
            return;
        }

        // Aquí se abriría un dialog de edición
        console.log('Editar bienhechoir:', this.beneficent);
        // TODO: Implementar dialog de edición
    }
}
