import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Récupérer le token d'authentification
    const token = this.authService.getToken();
    
    // Cloner la requête et ajouter les headers nécessaires
    let authReq = req;
    
    if (token) {
      authReq = req.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
    } else {
      authReq = req.clone({
        setHeaders: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
    }

    // Gérer les erreurs d'authentification
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si erreur 401 (Non autorisé), déconnecter l'utilisateur
        if (error.status === 401) {
          this.authService.logout().subscribe({
            complete: () => {
              this.router.navigate(['/login']);
            }
          });
        }
        
        // Si erreur 403 (Interdit), rediriger vers une page d'erreur
        if (error.status === 403) {
          console.error('Accès interdit:', error.error?.message || 'Permissions insuffisantes');
        }

        return throwError(() => error);
      })
    );
  }
}