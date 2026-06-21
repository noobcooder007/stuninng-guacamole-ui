import { Pipe, PipeTransform } from '@angular/core';
import { AuthService } from '@app/core/services/auth.service';

@Pipe({ name: 'hasPermission', standalone: true, pure: false })
export class HasPermissionPipe implements PipeTransform {
  constructor(private authService: AuthService) {}

  transform(permission: string | undefined): boolean {
    return this.authService.hasPermission(permission);
  }
}
