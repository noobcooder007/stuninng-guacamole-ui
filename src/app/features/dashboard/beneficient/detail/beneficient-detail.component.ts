import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { BeneficientService, Beneficient } from '@app/core/services/beneficient.service';

@Component({
    selector: 'beneficient-detail',
    templateUrl: './beneficient-detail.component.html',
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
})
export class BeneficientDetailComponent implements OnInit {
    private beneficientService = inject(BeneficientService);

    ngOnInit() {
        
    }
}
