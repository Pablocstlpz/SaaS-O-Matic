import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

import { Producto } from '../../../../interfaces/producto';

// EJEMPLO de componente hijo (presentacion): recibe datos con input() y AVISA con output().
// No navega, no llama a servicios y no sabe que hay una API: decidir que pasa al editar o
// borrar es cosa del padre (productos.ts). Asi el mismo hijo vale en una tabla, una tarjeta o un menu.
//   <app-producto-acciones [producto]="p" (editar)="editar($event)" (eliminar)="eliminar($event)" />
@Component({
  selector: 'app-producto-acciones',
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './producto-acciones.html',
  styleUrl: './producto-acciones.css',
})
export class ProductoAcciones {
  readonly producto = input.required<Producto>();

  readonly editar = output<Producto>();
  readonly eliminar = output<Producto>();
}
