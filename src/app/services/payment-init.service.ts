// src/app/services/payment-init.service.ts - SERVICE D'INITIALISATION RAPIDE
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StripeService } from './stripe.service';
import { environment, validateEnvironment, logEnvironmentInfo } from '../../environments/environment';

export interface PaymentSystemStatus {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  stripeLoaded: boolean;
  configValid: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentInitService {
  private statusSubject = new BehaviorSubject<PaymentSystemStatus>({
    isReady: false,
    isLoading: false,
    error: null,
    stripeLoaded: false,
    configValid: false
  });

  public status$ = this.statusSubject.asObservable();
  private initializationPromise: Promise<void> | null = null;

  constructor(private stripeService: StripeService) {
    console.log('💳 PaymentInitService démarré');
    
    // Validation immédiate de la configuration
    const configValid = validateEnvironment();
    this.updateStatus({ configValid });

    // Log des informations si debug activé
    logEnvironmentInfo();

    // Préchargement automatique si activé
    if (environment.stripe.preload && configValid) {
      this.initializePaymentSystem();
    }
  }

  /**
   * Initialiser le système de paiement de manière optimisée
   */
  async initializePaymentSystem(): Promise<void> {
    // Si déjà en cours d'initialisation, retourner la promesse existante
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Si déjà prêt, retourner immédiatement
    if (this.statusSubject.value.isReady) {
      return Promise.resolve();
    }

    console.log('🚀 Initialisation du système de paiement...');
    
    this.updateStatus({ 
      isLoading: true, 
      error: null 
    });

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  /**
   * Effectuer l'initialisation avec retry automatique
   */
  private async performInitialization(): Promise<void> {
    const maxRetries = environment.stripe.maxRetries;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        attempt++;
        console.log(`💳 Tentative ${attempt}/${maxRetries}`);

        // Timeout pour éviter les blocages
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), environment.stripe.loadTimeout);
        });

        // Course entre le chargement et le timeout
        await Promise.race([
          this.stripeService.loadStripe(),
          timeoutPromise
        ]);

        // Vérifier que Stripe est bien chargé
        if (!this.stripeService.isLoaded()) {
          throw new Error('Stripe non chargé après initialisation');
        }

        // Succès !
        console.log('✅ Système de paiement initialisé avec succès');
        this.updateStatus({
          isReady: true,
          isLoading: false,
          stripeLoaded: true,
          error: null
        });

        return;

      } catch (error: any) {
        console.warn(`⚠️ Tentative ${attempt} échouée:`, error.message);

        if (attempt >= maxRetries) {
          // Toutes les tentatives échouées
          const errorMessage = `Impossible d'initialiser le système de paiement après ${maxRetries} tentatives`;
          console.error('❌', errorMessage);
          
          this.updateStatus({
            isReady: false,
            isLoading: false,
            error: errorMessage
          });

          throw new Error(errorMessage);
        }

        // Attendre avant la prochaine tentative
        if (environment.stripe.retryOnFailure) {
          await this.delay(1000 * attempt); // Délai croissant
        }
      }
    }
  }

  /**
   * Réinitialiser le système en cas de problème
   */
  async resetPaymentSystem(): Promise<void> {
    console.log('🔄 Réinitialisation du système de paiement...');
    
    this.initializationPromise = null;
    this.stripeService.reset();
    
    this.updateStatus({
      isReady: false,
      isLoading: false,
      error: null,
      stripeLoaded: false
    });

    return this.initializePaymentSystem();
  }

  /**
   * Vérifier le statut actuel
   */
  getStatus(): PaymentSystemStatus {
    return this.statusSubject.value;
  }

  /**
   * Vérifier si le système est prêt
   */
  isReady(): boolean {
    return this.statusSubject.value.isReady;
  }

  /**
   * Attendre que le système soit prêt
   */
  async waitForReady(): Promise<void> {
    if (this.isReady()) {
      return Promise.resolve();
    }

    if (!this.statusSubject.value.isLoading) {
      // Démarrer l'initialisation si pas encore fait
      await this.initializePaymentSystem();
    }

    // Attendre que le statut change
    return new Promise((resolve, reject) => {
      const subscription = this.status$.subscribe(status => {
        if (status.isReady) {
          subscription.unsubscribe();
          resolve();
        } else if (status.error && !status.isLoading) {
          subscription.unsubscribe();
          reject(new Error(status.error));
        }
      });

      // Timeout de sécurité
      setTimeout(() => {
        subscription.unsubscribe();
        reject(new Error('Timeout d\'attente du système de paiement'));
      }, environment.stripe.loadTimeout);
    });
  }

  /**
   * Test de santé du système
   */
  async healthCheck(): Promise<{ success: boolean; details: any }> {
    try {
      console.log('🏥 Test de santé du système de paiement...');

      const details = {
        configValid: validateEnvironment(),
        stripeLoaded: this.stripeService.isLoaded(),
        canCreateCard: false,
        timestamp: new Date().toISOString()
      };

      // Test de création d'élément carte
      if (details.stripeLoaded) {
        try {
          const testCard = this.stripeService.createCardElement();
          details.canCreateCard = !!testCard;
          if (testCard && typeof testCard.destroy === 'function') {
            testCard.destroy();
          }
        } catch (error) {
          console.warn('⚠️ Impossible de créer un élément carte de test');
        }
      }

      const success = details.configValid && details.stripeLoaded && details.canCreateCard;

      console.log(success ? '✅ Test de santé réussi' : '❌ Test de santé échoué', details);

      return { success, details };

    } catch (error: any) {
      console.error('❌ Erreur test de santé:', error);
      return { 
        success: false, 
        details: { error: error.message } 
      };
    }
  }

  /**
   * Méthodes utilitaires
   */
  private updateStatus(updates: Partial<PaymentSystemStatus>): void {
    const currentStatus = this.statusSubject.value;
    const newStatus = { ...currentStatus, ...updates };
    this.statusSubject.next(newStatus);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtenir des informations de debug
   */
  getDebugInfo(): any {
    return {
      status: this.getStatus(),
      environment: {
        production: environment.production,
        stripeConfigured: !!environment.stripePublicKey,
        debugEnabled: environment.debug.enableLogging
      },
      stripe: {
        serviceLoaded: this.stripeService.isLoaded(),
        hasInitPromise: !!this.initializationPromise
      },
      timestamp: new Date().toISOString()
    };
  }
}