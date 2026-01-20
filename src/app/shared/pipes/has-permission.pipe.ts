import { Pipe, PipeTransform } from '@angular/core';
import { AuthService } from '@app/core/services/auth.service';

@Pipe({ name: 'hasPermission', standalone: true })
export class HasPermissionPipe implements PipeTransform {
  constructor(private authService: AuthService) {} // Tu servicio que guarda los permisos

  transform(permission: string | undefined): boolean {
    return this.authService.hasPermission(permission);
  }
}
