import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-empty-state',
    standalone: true,
    imports: [MatIconModule],
    template: `
        <div class="py-20 flex flex-col items-center gap-2">
            <mat-icon class="!text-[56px] !w-14 !h-14 text-[color:var(--mat-sys-outline-variant)]">
                {{ icon() }}
            </mat-icon>
            <span class="text-base font-medium text-[color:var(--mat-sys-on-surface-variant)]">
                Sin resultados
            </span>
            <span class="text-sm text-[color:var(--mat-sys-outline)]">
                @if (isFiltered()) { Intenta con otros filtros } @else { {{ message() }} }
            </span>
        </div>
    `,
})
export class EmptyStateComponent {
    icon = input('search_off');
    message = input('');
    isFiltered = input(false);
}
