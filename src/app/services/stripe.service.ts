// src/app/services/stripe.service.ts - VERSION OPTIMISÉE ET RAPIDE
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

declare var Stripe: any;

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripe: any = null;
  private elements: any = null;
  private loadingPromise: Promise<void> | null = null;
  private isReady = false;

  constructor() {
    console.log('🔧 StripeService - Initialisation optimisée');
  }

  /**
   * Chargement optimisé de Stripe
   */
  async loadStripe(): Promise<void> {
    // Si déjà prêt, retourner immédiatement
    if (this.isReady && this.stripe) {
      return Promise.resolve();
    }

    // Si déjà en cours de chargement, attendre
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Vérifier la clé publique
    if (!environment.stripePublicKey) {
      throw new Error('Clé publique Stripe manquante');
    }

    // Si Stripe est déjà chargé globalement
    if (typeof Stripe !== 'undefined') {
      this.initializeStripe();
      return Promise.resolve();
    }

    // Créer la promesse de chargement
    this.loadingPromise = this.loadStripeScript();
    return this.loadingPromise;
  }

  /**
   * Chargement optimisé du script Stripe
   */
  private loadStripeScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Vérifier si le script existe déjà
      const existingScript = document.querySelector('script[src*="stripe.com"]');
      if (existingScript) {
        this.initializeStripe();
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      
      script.onload = () => {
        try {
          console.log('✅ Script Stripe chargé');
          this.initializeStripe();
          resolve();
        } catch (error) {
          console.error('❌ Erreur initialisation Stripe:', error);
          reject(error);
        }
      };

      script.onerror = () => {
        console.error('❌ Impossible de charger Stripe');
        reject(new Error('Impossible de charger Stripe'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Initialisation simplifiée
   */
  private initializeStripe(): void {
    try {
      this.stripe = Stripe(environment.stripePublicKey);
      this.elements = this.stripe.elements();
      this.isReady = true;
      console.log('✅ Stripe initialisé rapidement');
    } catch (error) {
      console.error('❌ Erreur initialisation Stripe:', error);
      throw error;
    }
  }

  /**
   * Créer un élément de carte optimisé
   */
  createCardElement(): any {
    if (!this.isReady) {
      throw new Error('Stripe non prêt. Appelez loadStripe() d\'abord.');
    }

    const options = {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          '::placeholder': {
            color: '#aab7c4'
          }
        },
        invalid: {
          color: '#9e2146'
        }
      },
      hidePostalCode: true
    };

    return this.elements.create('card', options);
  }

  /**
   * Confirmer le paiement - Version simplifiée
   */
  async confirmCardPayment(clientSecret: string, card: any, billingDetails?: any): Promise<any> {
    if (!this.isReady) {
      throw new Error('Stripe non prêt');
    }

    const paymentData: any = {
      payment_method: {
        card: card
      }
    };

    if (billingDetails) {
      paymentData.payment_method.billing_details = billingDetails;
    }

    return await this.stripe.confirmCardPayment(clientSecret, paymentData);
  }

  /**
   * Vérifier si Stripe est prêt
   */
  isLoaded(): boolean {
    return this.isReady;
  }

  /**
   * Messages d'erreur en français
   */
  translateError(message: string): string {
    const translations: { [key: string]: string } = {
      'Your card number is incomplete.': 'Numéro de carte incomplet',
      'Your card number is invalid.': 'Numéro de carte invalide',
      'Your card\'s expiration date is incomplete.': 'Date d\'expiration incomplète',
      'Your card\'s expiration date is invalid.': 'Date d\'expiration invalide',
      'Your card\'s security code is incomplete.': 'Code de sécurité incomplet',
      'Your card\'s security code is invalid.': 'Code de sécurité invalide',
      'Your card was declined.': 'Carte refusée',
      'Your card has insufficient funds.': 'Fonds insuffisants',
      'Your card has expired.': 'Carte expirée'
    };

    return translations[message] || message;
  }

  /**
   * Réinitialiser en cas d'erreur
   */
  reset(): void {
    this.stripe = null;
    this.elements = null;
    this.isReady = false;
    this.loadingPromise = null;
  }
}