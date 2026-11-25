import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';

import { LIMITES } from '../../../shared/regex';
import { ErrorApi } from '../../../services/base-http.service';
import { SesionService } from '../../../services/sesion.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, TranslatePipe],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);
  private readonly destruir = inject(DestroyRef);

  // ?volver=/panel/... lo pone el authGuard; llega como input gracias a withComponentInputBinding
  readonly volver = input<string>();

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(LIMITES.EMAIL_MAX)]],
    password: ['', Validators.required],
  });

  protected entrar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);

    const { email, password } = this.formulario.getRawValue();
    this.sesion
      .iniciar(email, password)
      .pipe(takeUntilDestroyed(this.destruir))
      .subscribe({
        next: () => void this.router.navigateByUrl(this.volver() || '/panel'),
        error: (e: ErrorApi) => {
          // el texto lo redacta el servidor: la pantalla no inventa mensajes de error
          this.error.set(e.message);
          this.enviando.set(false);
        },
      });
  }
}
