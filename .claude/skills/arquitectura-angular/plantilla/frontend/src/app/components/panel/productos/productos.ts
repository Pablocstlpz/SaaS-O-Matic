import { Component, DestroyRef, OnInit, computed, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';

import { Producto } from '../../../interfaces/producto';
import { TiempoRelativoPipe } from '../../../pipes/tiempo-relativo-pipe';
import { ErrorApi } from '../../../services/base-http.service';
import { IdiomaService } from '../../../services/idioma.service';
import { NotificacionesService } from '../../../services/notificaciones.service';
import { ProductosService } from '../../../services/productos.service';
import { SesionService } from '../../../services/sesion.service';
import { Cargando } from '../../compartidos/cargando/cargando';
import { ProductoAcciones } from './producto-acciones/producto-acciones';

const COLUMNAS = ['nombre', 'estado', 'precio', 'fecha_actualizacion'];

// EJEMPLO de pantalla de listado (el padre): carga los datos, guarda el estado con signals,
// filtra con computed y decide que pasa cuando el hijo (producto-acciones) avisa de editar o eliminar.
// Tabla de Material con orden y paginacion en el navegador: vale mientras la lista quepa entera
// en una respuesta; si crece demasiado, el orden y la paginacion pasan al servidor (ver la skill, references/frontend.md §6).
@Component({
  selector: 'app-productos',
  imports: [
    RouterLink,
    CurrencyPipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    TranslatePipe,
    TiempoRelativoPipe,
    Cargando,
    ProductoAcciones,
  ],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  // Toda peticion de un componente lleva .pipe(takeUntilDestroyed(this.destruir)). Si el usuario se va
  // de la pantalla con la peticion en vuelo, la respuesta llegaria a un componente ya destruido y podria
  // navegar o sacar un aviso fuera de sitio. Se pasa el DestroyRef porque guardar, eliminar o cargar se
  // llaman fuera del contexto de inyeccion, donde takeUntilDestroyed() sin argumento lanza un error.
  private readonly destruir = inject(DestroyRef);
  protected readonly sesion = inject(SesionService);
  protected readonly idioma = inject(IdiomaService);

  protected readonly productos = signal<Producto[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busqueda = signal('');

  // se recalcula solo cuando cambian productos o busqueda
  protected readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.productos().filter((p) => p.nombre.toLowerCase().includes(texto));
  });

  // la columna de acciones solo existe para quien puede usarlas
  protected readonly columnas = computed(() => (this.sesion.esAdmin() ? [...COLUMNAS, 'acciones'] : COLUMNAS));

  // la tabla de Material lee de un MatTableDataSource, que es quien ordena y pagina
  protected readonly fuente = new MatTableDataSource<Producto>([]);
  // la tabla solo existe cuando hay datos (esta dentro de un @if): por eso son signals que pueden ser undefined
  private readonly orden = viewChild(MatSort);
  private readonly paginador = viewChild(MatPaginator);

  constructor() {
    effect(() => (this.fuente.data = this.filtrados()));
    effect(() => {
      this.fuente.sort = this.orden() ?? null;
      this.fuente.paginator = this.paginador() ?? null;
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.productosService
      .listar()
      .pipe(takeUntilDestroyed(this.destruir))
      .subscribe({
        next: (lista) => {
          this.productos.set(lista);
          this.cargando.set(false);
        },
        error: (e: ErrorApi) => {
          this.error.set(e.message);
          this.cargando.set(false);
        },
      });
  }

  protected editar(producto: Producto): void {
    void this.router.navigate([producto.id, 'editar'], { relativeTo: this.ruta });
  }

  protected async eliminar(producto: Producto): Promise<void> {
    const confirmado = await this.notificaciones.confirmar({
      titulo: 'productos.confirmarEliminar',
      texto: 'productos.confirmarEliminarTexto',
      confirmar: 'comun.eliminar',
      parametros: { nombre: producto.nombre },
      peligroso: true,
    });
    if (!confirmado) return;

    this.productosService
      .eliminar(producto.id)
      .pipe(takeUntilDestroyed(this.destruir))
      .subscribe({
        next: () => {
          // se quita de la lista local en vez de recargar todo
          this.productos.update((lista) => lista.filter((p) => p.id !== producto.id));
          this.notificaciones.aviso('productos.eliminado');
        },
        error: (e: ErrorApi) => this.notificaciones.error(e.message),
      });
  }
}
