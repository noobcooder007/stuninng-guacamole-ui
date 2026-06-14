import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Beneficient, BeneficientFilters, BeneficientService } from '@app/core/services/beneficient.service';
import { startWith, debounceTime, distinctUntilChanged, switchMap, map, catchError, of, delay } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { SearchBeneficientComponent } from '../../beneficient/search-beneficient/search-beneficient.component';
import { CreatePromiseDonationDto, PromisesDonationService } from '@app/core/services/promise-donation.service';
import { AddInstructionComponent } from '../add-instruction/add-instruction.component';
import { HourPipe } from '@app/shared/pipes/hour.pipe';

interface WeeklySchedule {
    day: string;
    hour: string;
    note: string;
}

interface Instructions {
    weeklySchedule: WeeklySchedule[];
    generalObservations: string;
}

@Component({
    selector: 'create-promise-donation',
    templateUrl: 'create-promise-donation.component.html',
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatSelectModule,
        MatDatepickerModule,
        MatButtonModule,
        MatCheckboxModule,
        MatIconModule,
        MatTableModule,
        MatProgressSpinnerModule,
        HourPipe,
    ]
})

export class CreatePromiseDonationComponent implements OnInit {
    public isLoading = signal(false);
    private readonly beneficientService = inject(BeneficientService);
    private readonly promiseDonationService = inject(PromisesDonationService);
    
    createPromiseDonationForm = new FormGroup({
        beneficientId: new FormControl<Beneficient | string | null>(null, [Validators.required]),
        promiseAmount: new FormControl(null, [Validators.required]),
        currency: new FormControl(null, [Validators.required]),
        method: new FormControl(null, [Validators.required]),
        recurring: new FormControl(true),
        recurrence: new FormControl(null, [Validators.required]),
        startDate: new FormControl(null, [Validators.required]),
    });
    public instructions: Instructions = {
        weeklySchedule: [],
        generalObservations: '',
    };
    public dataSource = new MatTableDataSource<WeeklySchedule>();
    public displayedColumns: string[] = ['day', 'hour', 'note', 'actions'];
    private readonly dialog = inject(MatDialog);
    beneficientList = signal<Beneficient[]>([]);

    @ViewChild(MatAutocompleteTrigger) autocompleteTrigger!: MatAutocompleteTrigger;

    ngOnInit() {
        this.loadBeneficients();
    }

    loadBeneficients(): void {
        this.createPromiseDonationForm.get('beneficientId')?.valueChanges.pipe(
            startWith(''),
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(value => {
                const searchTerm = typeof value === 'string'
                    ? value
                    : typeof value === 'object' ? value?.firstname || '' : '';
                const filters: BeneficientFilters = {
                    firstname: searchTerm,
                };
                if (searchTerm === '') this.dataSource.data = [];
                if (typeof value !== 'object') {
                    return this.beneficientService.getBeneficents(1, 5, filters).pipe(
                        map((response) => response.data.items),
                        catchError(() => of([])),
                        delay(0)
                    );
                }
                return of([]);
            })
        ).subscribe(beneficients => this.beneficientList.set(beneficients));
    }

    onBeneficientSelected(event: MatAutocompleteSelectedEvent): void {
        const selectedBeneficient = event.option.value
        if (selectedBeneficient && selectedBeneficient.id) {
            this.createPromiseDonationForm.patchValue({ beneficientId: selectedBeneficient });
        }
    }

    createPromiseDonation(): void {
        if (this.createPromiseDonationForm.invalid) return;
        const dto = this.createPromiseDonationForm.value as any as CreatePromiseDonationDto;
        dto.instructions = this.instructions;
        const beneficientValue = this.createPromiseDonationForm.value.beneficientId;
        dto.beneficientId = (typeof beneficientValue === 'object' && beneficientValue !== null) 
            ? beneficientValue.id.toString() 
            : '';

        this.isLoading.set(true);
        this.promiseDonationService.create(dto).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.reset();
            },
            error: () => this.isLoading.set(false),
        });
    }

    reset(): void {
        this.createPromiseDonationForm.reset();
    }

    displayFn(beneficient: Beneficient): string {
        return beneficient && `${beneficient.firstname} ${beneficient.firstLastname} ${beneficient.secondLastname ?? ''}`;
    }

    openAdvancedSearch(): void {
        if (this.autocompleteTrigger) this.autocompleteTrigger.closePanel();
        const dialogRef = this.dialog.open(SearchBeneficientComponent, {
            minWidth: '70vw',
            disableClose: true,
            hasBackdrop: true,
            data: { currentFilter: this.createPromiseDonationForm.get('beneficientId')?.value }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.createPromiseDonationForm.patchValue({ beneficientId: result });
                const beneficientCtrl = this.createPromiseDonationForm.get('beneficientId');
                beneficientCtrl?.setValue(result);
                beneficientCtrl?.markAsDirty();
                beneficientCtrl?.updateValueAndValidity();
            }
        });
    }
    
    addInstruction(): void {
        const dialogRef = this.dialog.open(AddInstructionComponent, {
            minWidth: '70vw',
            disableClose: true,
            hasBackdrop: true,
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const alreadyExists = this.instructions.weeklySchedule.findIndex((v) => {
                    return v.day === result.day && v.hour === result.hour;
                });
                if (alreadyExists !== -1) return;
                this.instructions.weeklySchedule.push(result);
                this.dataSource.data = this.instructions.weeklySchedule;
            }
        });
    }

    editInstruction(value: WeeklySchedule): void {
        const index = this.instructions.weeklySchedule.findIndex((v) => {
            return v.day === value.day && v.hour === value.hour;
        });
        const dialogRef = this.dialog.open(AddInstructionComponent, {
            minWidth: '70vw',
            disableClose: true,
            hasBackdrop: true,
            data: this.instructions.weeklySchedule[index]
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.instructions.weeklySchedule[index] = result;
                this.dataSource.data = this.instructions.weeklySchedule;
            }
        });
    }

    removeInstruction(index: number): void {
        this.instructions.weeklySchedule.splice(index, 1);
        this.dataSource.data = this.instructions.weeklySchedule;
    }

    canAddInstruction(): boolean {
        return this.instructions.weeklySchedule.length < 3;
    }
}
