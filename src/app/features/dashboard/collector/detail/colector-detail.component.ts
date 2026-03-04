import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CollectorService } from '@app/core/services/collector.service';

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
})
export class ColectorDetailComponent implements OnInit {
    private colectorService = inject(CollectorService);

    ngOnInit() {
        
    }
}
