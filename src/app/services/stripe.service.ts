// src/app/services/stripe.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

declare var Stripe: any;

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripe: any = null;
  private elements: any = null;
  private stripeLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  constructor() {}

  /**
   * Charger Stripe de manière asynchrone
   */
  loadStripe(): Promise<void> {
    // Si déjà en cours de chargement, retourner la même promesse
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Si déjà chargé, résoudre immédiatement
    if (this.stripeLoaded && this.stripe) {
      return Promise.resolve();
    }

    // Vérifier si Stripe est déjà disponible globalement
    if (typeof Stripe !== 'undefined') {
      this.initializeStripe();
      return Promise.resolve();
    }

    // Charger le script Stripe
    this.loadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        try {
          this.initializeStripe();
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      script.onerror = () => {
        reject(new Error('Impossible de charger Stripe'));
      };
      document.head.appendChild(script);
    });

    return this.loadingPromise;
  }

  /**
   * Initialiser Stripe avec la clé publique
   */
  private initializeStripe(): void {
    if (!environment.stripePublicKey) {
      throw new Error('Clé publique Stripe manquante dans la configuration');
    }

    if (typeof Stripe === 'undefined') {
      throw new Error('Stripe n\'est pas chargé');
    }

    this.stripe = Stripe(environment.stripePublicKey);
    this.elements = this.stripe.elements();
    this.stripeLoaded = true;
    
    console.log('✅ Stripe initialisé avec succès');
  }

  /**
   * Obtenir l'instance Stripe
   */
  getStripe(): any {
    if (!this.stripe) {
      throw new Error('Stripe n\'est pas encore initialisé. Appelez loadStripe() d\'abord.');
    }
    return this.stripe;
  }

  /**
   * Obtenir les éléments Stripe
   */
  getElements(): any {
    if (!this.elements) {
      throw new Error('Stripe Elements n\'est pas encore initialisé. Appelez loadStripe() d\'abord.');
    }
    return this.elements;
  }

  /**
   * Créer un élément de carte
   */
  createCardElement(options?: any): any {
    const defaultOptions = {
      style: {
        base: {
          color: '#424770',
          fontFamily: '"Roboto", "Helvetica Neue", Helvetica, sans-serif',
          fontSmoothing: 'antialiased',
          fontSize: '16px',
          '::placeholder': {
            color: '#aab7c4'
          }
        },
        invalid: {
          color: '#9e2146',
          iconColor: '#9e2146'
        }
      },
      hidePostalCode: true
    };

    const finalOptions = { ...defaultOptions, ...options };
    return this.getElements().create('card', finalOptions);
  }

  /**
   * Confirmer un paiement par carte
   */
  async confirmCardPayment(clientSecret: string, card: any, billingDetails?: any): Promise<any> {
    const stripe = this.getStripe();
    
    const paymentData: any = {
      payment_method: {
        card: card
      }
    };

    if (billingDetails) {
      paymentData.payment_method.billing_details = billingDetails;
    }

    return await stripe.confirmCardPayment(clientSecret, paymentData);
  }

  /**
   * Vérifier si Stripe est chargé
   */
  isLoaded(): boolean {
    return this.stripeLoaded && !!this.stripe;
  }

  /**
   * Traduire les erreurs Stripe
   */
  translateError(message: string): string {
    const translations: { [key: string]: string } = {
      'Your card number is incomplete.': 'Votre numéro de carte est incomplet.',
      'Your card number is invalid.': 'Votre numéro de carte est invalide.',
      'Your card\'s expiration date is incomplete.': 'La date d\'expiration de votre carte est incomplète.',
      'Your card\'s expiration date is invalid.': 'La date d\'expiration de votre carte est invalide.',
      'Your card\'s security code is incomplete.': 'Le code de sécurité de votre carte est incomplet.',
      'Your card\'s security code is invalid.': 'Le code de sécurité de votre carte est invalide.',
      'Your card was declined.': 'Votre carte a été refusée.',
      'Your card has insufficient funds.': 'Votre carte a des fonds insuffisants.',
      'Your card has expired.': 'Votre carte a expiré.',
      'An error occurred while processing your card.': 'Une erreur s\'est produite lors du traitement de votre carte.'
    };

    return translations[message] || message;
  }
}