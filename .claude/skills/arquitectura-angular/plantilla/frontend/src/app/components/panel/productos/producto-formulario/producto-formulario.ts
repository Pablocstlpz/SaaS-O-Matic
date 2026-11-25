import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';

import { EstadoProducto } from '../../../../interfaces/producto';
import { ESTADOS_PRODUCTO, LIMITES } from '../../../../shared/regex';
import { ErrorApi } from '../../../../services/base-http.service';
import { NotificacionesService } from '../../../../services/notificaciones.service';
import { ProductosService } from '../../../../services/productos.service';
import { Cargando } from '../../../compartidos/cargando/cargando';

// EJEMPLO de formulario: crear y editar en la MISMA pantalla.
// Si la ruta trae :id, edita; si no, crea. Los validadores usan los LIMITES gemelos del backend.
@Component({
  selector: 'app-producto-formulario',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
    Cargando,
  ],
  templateUrl: './producto-formulario.html',
  styleUrl: './producto-formulario.css',
})
export class ProductoFormulario implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);
  private readonly destruir = inject(DestroyRef);

  // :id de la ruta (llega como texto y se envia tal cual: ver interfaces/id.ts); undefined en /productos/nuevo
  readonly id = input<string>();
  protected readonly editando = computed(() => this.id() !== undefined);

  protected readonly estados = ESTADOS_PRODUCTO;
  protected readonly limites = LIMITES;
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(LIMITES.PRODUCTO_NOMBRE_MAX)]],
    precio: [0, [Validators.required, Validators.min(0), Validators.max(LIMITES.PRECIO_MAX)]],
    estado: ['activo' as EstadoProducto],
  });

  ngOnInit(): void {
    const id = this.id();
    if (id === undefined) return;

    this.cargando.set(true);
    this.productosService
      .obtener(id)
      .pipe(takeUntilDestroyed(this.destruir))
      .subscribe({
        next: ({ nombre, precio, estado }) => {
          this.formulario.setValue({ nombre, precio, estado });
          this.cargando.set(false);
        },
        error: (e: ErrorApi) => {
          this.error.set(e.message);
          this.cargando.set(false);
        },
      });
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set(null);

    const datos = this.formulario.getRawValue();
    const id = this.id();
    const peticion =
      id === undefined ? this.productosService.crear(datos) : this.productosService.actualizar(id, datos);

    peticion.pipe(takeUntilDestroyed(this.destruir)).subscribe({
      next: () => {
        this.notificaciones.aviso('productos.guardado');
        void this.router.navigate(['/panel/productos']);
      },
      error: (e: ErrorApi) => {
        this.guardando.set(false);
        // ejemplo de reaccionar a un `tipo` del backend: el error se pinta junto a su campo
        if (e.tipo === 'NOMBRE_REPETIDO') {
          this.formulario.controls.nombre.setErrors({ repetido: e.message });
          this.formulario.controls.nombre.markAsTouched();
          return;
        }
        this.error.set(e.message);
      },
    });
  }
}
