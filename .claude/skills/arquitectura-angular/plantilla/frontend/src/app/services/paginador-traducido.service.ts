import { Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';

// Textos del paginador de Material (por defecto en ingles: "Items per page", "1 – 10 of 42").
// Se registra UNA vez, en el layout de la zona con tablas (panel-layout.ts), y vale para todas sus
// pantallas; se retraduce al cambiar de idioma.
@Injectable()
export class PaginadorTraducido extends MatPaginatorIntl {
  private readonly translate = inject(TranslateService);

  constructor() {
    super();
    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => this.traducir());
    this.traducir();
  }

  override getRangeLabel = (pagina: number, tamano: number, total: number): string => {
    const de = this.translate.instant('paginador.de');
    if (total === 0) return `0 ${de} 0`;
    const desde = pagina * tamano + 1;
    return `${desde} – ${Math.min(desde + tamano - 1, total)} ${de} ${total}`;
  };

  private traducir(): void {
    this.itemsPerPageLabel = this.translate.instant('paginador.porPagina');
    this.nextPageLabel = this.translate.instant('paginador.siguiente');
    this.previousPageLabel = this.translate.instant('paginador.anterior');
    this.firstPageLabel = this.translate.instant('paginador.primera');
    this.lastPageLabel = this.translate.instant('paginador.ultima');
    // avisa a los paginadores ya pintados de que repinten sus textos
    this.changes.next();
  }
}
