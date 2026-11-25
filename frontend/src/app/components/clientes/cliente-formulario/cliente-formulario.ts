import { Component, effect, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { DatosCliente } from '../../../interfaces/cliente';
import { ErrorCampo } from '../../../services/base-http.service';
import { PAISES, PLANES } from '../../../shared/regex';
import { crearFormulario } from './formulario-cliente';

// Formulario de alta (hijo). Valida en vivo y avisa con los datos cuando son válidos;
// el padre envía y le devuelve los errores del servidor que tienen campo.
@Component({
  selector: 'app-cliente-formulario',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './cliente-formulario.html',
  styleUrl: './cliente-formulario.css',
  // en vivo: el aviso sale al escribir, sin esperar a salir del campo
  providers: [{ provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }],
})
export class ClienteFormulario {
  readonly guardando = input.required<boolean>();
  readonly errores = input.required<readonly ErrorCampo[]>();
  readonly enviar = output<DatosCliente>();

  protected readonly formulario = crearFormulario();
  protected readonly paises = PAISES;
  protected readonly planes = PLANES;

  constructor() {
    const { pais, identificador_fiscal } = this.formulario.controls;
    // el formato del identificador depende del país
    pais.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => identificador_fiscal.updateValueAndValidity());
    // cada error del servidor, junto a su campo; se borra al cambiar ese campo
    effect(() => {
      for (const { campo, mensaje } of this.errores()) this.formulario.get(campo)?.setErrors({ mensaje });
    });
  }

  protected enviarSiVale(): void {
    const { pais, plan, ...textos } = this.formulario.getRawValue();
    if (this.guardando() || this.formulario.invalid || pais === null || plan === null) return;
    this.enviar.emit({ ...textos, pais, plan });
  }
}
