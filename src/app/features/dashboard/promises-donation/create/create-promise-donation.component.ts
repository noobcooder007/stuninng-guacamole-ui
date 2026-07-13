import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Beneficient, BeneficientService } from '@app/core/services/beneficient.service';
import { startWith, debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CollectorInstructions, CreatePromiseDonationDto, PromisesDonationService, WeeklyScheduleItem } from '@app/core/services/promise-donation.service';
import { AddInstructionComponent } from '../add-instruction/add-instruction.component';
import { HourPipe } from '@app/shared/pipes/hour.pipe';
import { HasPermissionPipe } from '@app/shared/pipes/has-permission.pipe';
import { Permissions } from '@app/shared/enums/app-permission.enum';

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
        MatTooltipModule,
        MatTableModule,
        MatProgressSpinnerModule,
        HourPipe,
        HasPermissionPipe,
    ]
})

export class CreatePromiseDonationComponent implements OnInit {
    protected readonly Permissions = Permissions;
    public isLoading = signal(false);
    private readonly beneficientService = inject(BeneficientService);
    private readonly promiseDonationService = inject(PromisesDonationService);
    private readonly snackbar = inject(MatSnackBar);
    
    createPromiseDonationForm = new FormGroup({
        beneficientId: new FormControl<Beneficient | string | null>(null, [Validators.required]),
        promiseAmount: new FormControl(null, [Validators.required]),
        currency: new FormControl(null, [Validators.required]),
        method: new FormControl(null, [Validators.required]),
        recurring: new FormControl(true),
        recurrence: new FormControl(null, [Validators.required]),
        startDate: new FormControl(null, [Validators.required]),
    });
    public instructions: CollectorInstructions = {
        weeklySchedule: [],
        generalObservations: '',
    };
    public dataSource = new MatTableDataSource<WeeklyScheduleItem>();
    public displayedColumns: string[] = ['day', 'hours', 'note', 'actions'];
    private readonly dialog = inject(MatDialog);
    beneficientList = signal<Beneficient[]>([]);

    ngOnInit() {
        this.loadBeneficients();
    }

    loadBeneficients(): void {
        this.createPromiseDonationForm.get('beneficientId')?.valueChanges.pipe(
            startWith(''),
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(value => {
                const searchTerm = typeof value === 'string' ? value.trim() : '';
                if (typeof value !== 'object') {
                    return this.beneficientService.getActiveList(searchTerm || undefined).pipe(
                        catchError(() => of([]))
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
                this.snackbar.open('Promesa de donación creada correctamente', 'Cerrar', { duration: 4000 });
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

    addInstruction(): void {
        const dialogRef = this.dialog.open(AddInstructionComponent, {
            minWidth: '70vw',
            disableClose: true,
            hasBackdrop: true,
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const alreadyExists = this.instructions.weeklySchedule.findIndex((v) => {
                    return v.day === result.day && v.hours === result.hours;
                });
                if (alreadyExists !== -1) return;
                this.instructions.weeklySchedule.push(result);
                this.dataSource.data = this.instructions.weeklySchedule;
            }
        });
    }

    editInstruction(value: WeeklyScheduleItem): void {
        const index = this.instructions.weeklySchedule.findIndex((v) => {
            return v.day === value.day && v.hours === value.hours;
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
