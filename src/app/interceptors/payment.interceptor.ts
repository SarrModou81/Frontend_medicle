// src/app/interceptors/payment.interceptor.ts - INTERCEPTEUR OPTIMISÉ
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retry, catchError, timeout } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';

@Injectable()
export class PaymentInterceptor implements HttpInterceptor {
  
  constructor(private snackBar: MatSnackBar) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Vérifier si c'est une requête de paiement
    const isPaymentRequest = this.isPaymentEndpoint(req.url);
    
    if (!isPaymentRequest) {
      return next.handle(req);
    }

    console.log('💳 Intercepting payment request:', req.url);

    // Optimiser la requête pour les paiements
    const optimizedReq = this.optimizeRequest(req);

    return next.handle(optimizedReq).pipe(
      // Timeout adapté aux paiements
      timeout(environment.api.timeout || 30000),
      
      // Retry automatique pour certaines erreurs
      retry({
        count: environment.api.enableRetry ? 2 : 0,
        delay: (error, retryCount) => {
          console.log(`🔄 Retry ${retryCount} for payment request`);
          return timer(environment.api.retryDelay || 1000);
        },
        resetOnSuccess: true
      }),
      
      // Gestion d'erreurs spécialisée
      catchError((error: HttpErrorResponse) => this.handlePaymentError(error))
    );
  }

  /**
   * Vérifier si c'est un endpoint de paiement
   */
  private isPaymentEndpoint(url: string): boolean {
    const paymentEndpoints = [
      '/paiements',
      '/stripe',
      '/payment'
    ];
    
    return paymentEndpoints.some(endpoint => url.includes(endpoint));
  }

  /**
   * Optimiser la requête pour les paiements
   */
  private optimizeRequest(req: HttpRequest<any>): HttpRequest<any> {
    return req.clone({
      setHeaders: {
        // Headers optimisés pour les paiements
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Payment-Client': 'angular-optimized',
        'X-Requested-With': 'XMLHttpRequest'
      },
      
      // Paramètres de cache optimisés
      setParams: {
        '_timestamp': Date.now().toString() // Éviter le cache pour les paiements
      }
    });
  }

  /**
   * Gestion spécialisée des erreurs de paiement
   */
  private handlePaymentError(error: HttpErrorResponse): Observable<never> {
    let userMessage = 'Erreur de paiement';
    let shouldRetry = false;

    console.error('💳 Payment Error:', error);

    // Classification des erreurs
    switch (error.status) {
      case 0:
        // Erreur réseau
        userMessage = 'Problème de connexion. Vérifiez votre réseau.';
        shouldRetry = true;
        break;

      case 400:
        // Erreur de validation
        if (error.error?.message) {
          userMessage = error.error.message;
        } else {
          userMessage = 'Données de paiement invalides.';
        }
        break;

      case 401:
        // Non autorisé
        userMessage = 'Session expirée. Veuillez vous reconnecter.';
        break;

      case 402:
        // Payment required / Erreur de carte
        userMessage = 'Problème avec votre carte bancaire.';
        break;

      case 403:
        // Forbidden
        userMessage = 'Vous n\'êtes pas autorisé à effectuer ce paiement.';
        break;

      case 404:
        // Ressource non trouvée
        userMessage = 'Paiement ou rendez-vous non trouvé.';
        break;

      case 408:
        // Timeout
        userMessage = 'Délai d\'attente dépassé. Veuillez réessayer.';
        shouldRetry = true;
        break;

      case 422:
        // Validation error
        if (error.error?.errors) {
          const firstError = Object.values(error.error.errors)[0];
          userMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        } else {
          userMessage = 'Données de paiement incorrectes.';
        }
        break;

      case 429:
        // Too many requests
        userMessage = 'Trop de tentatives. Veuillez patienter quelques minutes.';
        break;

      case 500:
        // Erreur serveur
        userMessage = 'Erreur du serveur de paiement. Veuillez réessayer.';
        shouldRetry = true;
        break;

      case 502:
      case 503:
      case 504:
        // Erreurs de gateway/service
        userMessage = 'Service de paiement temporairement indisponible.';
        shouldRetry = true;
        break;

      default:
        userMessage = `Erreur de paiement (${error.status})`;
        break;
    }

    // Afficher le message à l'utilisateur
    this.showErrorMessage(userMessage, shouldRetry);

    // Log détaillé pour le debug
    this.logPaymentError(error, userMessage);

    return throwError(() => ({
      ...error,
      userMessage,
      shouldRetry,
      isPaymentError: true
    }));
  }

  /**
   * Afficher le message d'erreur à l'utilisateur
   */
  private showErrorMessage(message: string, shouldRetry: boolean): void {
    const action = shouldRetry ? 'Réessayer' : 'Fermer';
    
    this.snackBar.open(message, action, {
      duration: shouldRetry ? 8000 : 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  /**
   * Logger les erreurs de paiement pour le debug
   */
  private logPaymentError(error: HttpErrorResponse, userMessage: string): void {
    if (environment.debug.enableLogging) {
      console.group('💳 Payment Error Details');
      console.error('Status:', error.status);
      console.error('URL:', error.url);
      console.error('Message:', error.message);
      console.error('User Message:', userMessage);
      console.error('Response:', error.error);
      console.error('Headers:', error.headers);
      console.groupEnd();
    }

    // En production, logger seulement les infos essentielles
    if (environment.production) {
      console.error('Payment Error:', {
        status: error.status,
        url: error.url?.replace(/\/api\/.*/, '/api/***'), // Masquer les détails d'URL
        timestamp: new Date().toISOString()
      });
    }
  }
}

// =================== SERVICE D'ENREGISTREMENT ===================

import { HTTP_INTERCEPTORS } from '@angular/common/http';

export const PaymentInterceptorProvider = {
  provide: HTTP_INTERCEPTORS,
  useClass: PaymentInterceptor,
  multi: true
};

// =================== TYPES POUR TYPESCRIPT ===================

export interface PaymentError extends HttpErrorResponse {
  userMessage: string;
  shouldRetry: boolean;
  isPaymentError: boolean;
}

// =================== UTILISATION ===================

/*
// Dans app.module.ts, ajouter le provider :

import { PaymentInterceptorProvider } from './interceptors/payment.interceptor';

@NgModule({
  providers: [
    PaymentInterceptorProvider,
    // ... autres providers
  ]
})
export class AppModule { }

// Dans un composant, pour gérer les erreurs :

this.apiService.creerPaiement(data).subscribe({
  next: (response) => {
    // Succès
  },
  error: (error: PaymentError) => {
    if (error.isPaymentError) {
      // L'intercepteur a déjà géré l'affichage du message
      console.log('Payment error handled by interceptor');
      
      if (error.shouldRetry) {
        // Proposer un bouton "Réessayer"
        this.showRetryOption();
      }
    }
  }
});
*/