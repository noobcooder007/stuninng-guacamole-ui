import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Subject } from 'rxjs';

@Injectable()
export class SpanishPaginatorIntl implements MatPaginatorIntl {
  changes = new Subject<void>();

  firstPageLabel = 'Primera página';
  lastPageLabel = 'Última página';
  nextPageLabel = 'Página siguiente';
  previousPageLabel = 'Página anterior';
  itemsPerPageLabel = 'Filas por página:';

  getRangeLabel(page: number, pageSize: number, length: number): string {
    if (length === 0) return 'Página 1 de 1';
    const totalPages = Math.ceil(length / pageSize);
    return `Página ${page + 1} de ${totalPages}`;
  }
}
