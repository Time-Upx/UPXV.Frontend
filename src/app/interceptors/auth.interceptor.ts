import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const router = inject(Router);

  // Adicionar token às requisições (se existir)
  const token = localStorage.getItem('token');
  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Se for erro 401 (token expirado/inválido)
      if (error.status === 401) {
        console.log('Token expirado/inválido detectado. Redirecionando para login...');

        // Remove o token inválido
        localStorage.removeItem('token');

        // Redireciona para login
        router.navigate(['/login']).then(() => {
          // Mostra alerta ao usuário (opcional)
          const mensagem = 'Sua sessão expirou. Faça login novamente.';
          alert(mensagem); // Ou use um toast/snackbar
        });

        // Para a requisição atual e não propaga o erro
        return throwError(() => new Error('Sessão expirada - redirecionando'));
      }

      // Para outros erros, propaga normalmente
      return throwError(() => error);
    })
  );
};