import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { UploadsService } from '@app/core/services/uploads.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-uploads',
  standalone: true,
  templateUrl: './uploads.component.html',
  styleUrl: './uploads.component.scss',
  imports: [
    CommonModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    ReactiveFormsModule,
    MatProgressBarModule,
  ],
})
export class UploadsComponent implements OnInit {
  private uploadsService = inject(UploadsService);

  public activeTab: number = 0;
  public isUploading = false;
  public uploadProgress = 0;
  public selectedDepositFile: File | null = null;
  public selectedInformationFile: File | null = null;

  public uploadForm = new FormGroup({
    file: new FormControl(''),
  });

  ngOnInit(): void {
    // Lógica de inicialización
  }

  onDepositFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedDepositFile = input.files[0];
    }
  }

  onInformationFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedInformationFile = input.files[0];
    }
  }

  uploadDepositFile(): void {
    if (!this.selectedDepositFile) {
      console.error('No file selected');
      return;
    }

    this.isUploading = true;
    this.uploadsService.uploadDepositFile(this.selectedDepositFile).subscribe({
      next: (event: any) => {
        if (event.type === 1) { // HttpProgressEvent
          const total = event.total || 0;
          this.uploadProgress = Math.round((100 * event.loaded) / total);
        } else if (event.body) {
          console.log('File uploaded successfully:', event.body);
          this.isUploading = false;
          this.uploadProgress = 0;
          this.selectedDepositFile = null;
          // TODO: Mostrar notificación de éxito
        }
      },
      error: (error) => {
        console.error('Error uploading file:', error);
        this.isUploading = false;
        this.uploadProgress = 0;
        // TODO: Mostrar notificación de error
      },
    });
  }

  uploadInformationFile(): void {
    if (!this.selectedInformationFile) {
      console.error('No file selected');
      return;
    }

    this.isUploading = true;
    this.uploadsService.uploadInformationFile(this.selectedInformationFile).subscribe({
      next: (event: any) => {
        if (event.type === 1) { // HttpProgressEvent
          const total = event.total || 0;
          this.uploadProgress = Math.round((100 * event.loaded) / total);
        } else if (event.body) {
          console.log('File uploaded successfully:', event.body);
          this.isUploading = false;
          this.uploadProgress = 0;
          this.selectedInformationFile = null;
          // TODO: Mostrar notificación de éxito
        }
      },
      error: (error) => {
        console.error('Error uploading file:', error);
        this.isUploading = false;
        this.uploadProgress = 0;
        // TODO: Mostrar notificación de error
      },
    });
  }
}
