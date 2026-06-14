import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RecibosService, ImpresionReciboFilters } from '@app/core/services/recibos.service';
import { PdfPreviewDialogComponent } from './pdf-preview-dialog.component';

type PrintAction = 'recibos' | 'carta';

@Component({
    selector: 'app-impresion-recibos',
    standalone: true,
    templateUrl: './impresion-recibos.component.html',
    styleUrl: './impresion-recibos.component.scss',
    imports: [
        FormsModule,
        MatButtonModule,
        MatCardModule,
        MatDividerModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatProgressSpinnerModule,
    ],
})
export class ImpresionRecibosComponent {
    private readonly recibosService = inject(RecibosService);
    private readonly dialog = inject(MatDialog);

    readonly loadingAction = signal<PrintAction | null>(null);

    readonly months = [
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

    readonly years = Array.from({ length: new Date().getFullYear() - 2000 + 3 }, (_, i) => {
        const year = 2000 + i;
        return { value: String(year), label: String(year) };
    });

    private readonly now = new Date();

    filters: ImpresionReciboFilters = {
        month: String(this.now.getMonth() + 1).padStart(2, '0'),
        year: String(this.now.getFullYear()),
        firstname: null,
        firstLastname: null,
        secondLastname: null,
        collectorNumber: null,
        fromSequence: null,
        toSequence: null,
    };

    clearFilters(): void {
        const now = new Date();
        this.filters = {
            month: String(now.getMonth() + 1).padStart(2, '0'),
            year: String(now.getFullYear()),
            firstname: null,
            firstLastname: null,
            secondLastname: null,
            collectorNumber: null,
            fromSequence: null,
            toSequence: null,
        };
    }

    printRecibos(): void {
        this.confirmAndPrint('recibos', 'Imprimir_Recibos.pdf');
    }

    printCarta(): void {
        this.confirmAndPrint('carta', 'Carta_Recibos.pdf');
    }

    private confirmAndPrint(action: PrintAction, filename: string): void {
        const ref = this.dialog.open(PdfPreviewDialogComponent, {
            data: { filename },
            width: '480px',
        });

        ref.afterClosed().subscribe((confirmed: boolean) => {
            if (!confirmed) return;
            this.fetchAndOpen(action, filename);
        });
    }

    private fetchAndOpen(action: PrintAction, filename: string): void {
        if (this.loadingAction() !== null) return;
        this.loadingAction.set(action);

        const source$ = action === 'recibos'
            ? this.recibosService.imprimirRecibos(this.filters)
            : this.recibosService.imprimirCartaActual(this.filters);

        source$.subscribe({
            next: (blob) => {
                this.loadingAction.set(null);
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                setTimeout(() => URL.revokeObjectURL(url), 60_000);
            },
            error: () => this.loadingAction.set(null),
        });
    }
}
