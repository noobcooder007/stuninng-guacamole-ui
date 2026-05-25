import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hour',
  standalone: true // Si usas Standalone Components
})
export class HourPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    
    // Separamos horas y minutos
    const [hours, minutes] = value.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const adjustedHour = hours % 12 || 12; // Convierte 0 a 12 y 20 a 8
    
    return `${adjustedHour}:${minutes.toString().padStart(2, '0')} ${suffix}`;
  }
}
