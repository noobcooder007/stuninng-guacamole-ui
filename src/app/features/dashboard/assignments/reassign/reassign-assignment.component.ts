import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';
import { Assignment, AssignmentService } from '@app/core/services/assignment.service';
import { CollectorListItem, CollectorService } from '@app/core/services/collector.service';
import { FullnamePipe } from '@app/shared/pipes/fullname.pipe';

@Component({
    selector: 'reassign-assignment',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        FullnamePipe,
    ],
    templateUrl: './reassign-assignment.component.html',
})
export class ReassignAssignmentComponent implements OnInit {
    private readonly router = inject(Router);
    private readonly assignmentService = inject(AssignmentService);
    private readonly collectorService = inject(CollectorService);

    public isSaving = signal(false);
    public isLoadingAssignments = signal(false);

    public filteredOrigin = signal<CollectorListItem[]>([]);
    public filteredDest = signal<CollectorListItem[]>([]);

    public originCtrl = new FormControl<CollectorListItem | string | null>(null);
    public destCtrl = new FormControl<CollectorListItem | string | null>(null);
    public reasonCtrl = new FormControl('', Validators.required);

    public originAssignments: Assignment[] = [];
    public availableAssignments: Assignment[] = [];
    public selectedAssignments: Assignment[] = [];

    ngOnInit() {
        this.collectorService.getActiveList().subscribe(items => {
            this.filteredOrigin.set(items);
            this.filteredDest.set(items);
        });

        this.originCtrl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
        ).subscribe(v => {
            if (typeof v === 'string') {
                this.collectorService.getActiveList(v || undefined).subscribe(items => this.filteredOrigin.set(items));
            } else if (v !== null) {
                this.loadOriginAssignments(v);
            }
        });

        this.destCtrl.valueChanges.pipe(
            filter(v => typeof v === 'string'),
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(v => this.collectorService.getActiveList((v as string) || undefined)),
        ).subscribe(items => this.filteredDest.set(items));
    }

    displayCollector = (c: CollectorListItem | null) =>
        c ? `${c.firstname} ${c.firstLastname} ${c.secondLastname ?? ''}`.trim() : '';

    private loadOriginAssignments(collector: CollectorListItem) {
        this.isLoadingAssignments.set(true);
        this.availableAssignments = [];
        this.selectedAssignments = [];
        this.assignmentService.getAssignments(1, 200, { collectorId: collector.id }).subscribe({
            next: ({ data: { items } }) => {
                this.originAssignments = items;
                this.availableAssignments = [...items];
                this.isLoadingAssignments.set(false);
            },
            error: () => this.isLoadingAssignments.set(false),
        });
    }

    moveRight(assignment: Assignment) {
        this.availableAssignments = this.availableAssignments.filter(a => a.id !== assignment.id);
        this.selectedAssignments = [...this.selectedAssignments, assignment];
    }

    moveLeft(assignment: Assignment) {
        this.selectedAssignments = this.selectedAssignments.filter(a => a.id !== assignment.id);
        this.availableAssignments = [...this.availableAssignments, assignment];
    }

    get destCollector(): CollectorListItem | null {
        const v = this.destCtrl.value;
        return typeof v === 'string' || v === null ? null : v;
    }

    get canSave(): boolean {
        return this.selectedAssignments.length > 0
            && this.destCollector !== null
            && this.reasonCtrl.valid;
    }

    save() {
        if (!this.canSave) return;
        this.isSaving.set(true);

        this.assignmentService.reassign({
            collectorId: this.destCollector!.id,
            reassignAssignations: this.selectedAssignments.map(a => ({
                assignationId: a.id,
                reason: this.reasonCtrl.value!,
            })),
        }).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.originCtrl.reset();
                this.destCtrl.reset();
                this.reasonCtrl.reset();
                this.availableAssignments = [];
                this.selectedAssignments = [];
            },
            error: () => this.isSaving.set(false),
        });
    }

    cancel() { this.router.navigate(['/assignments']); }
}
