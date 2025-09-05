// src/app/components/shared/stripe-test/stripe-test.component.ts - COMPOSANT DE TEST
import { Component, OnInit } from '@angular/core';
import { StripeService } from '../../../services/stripe.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-stripe-test',
  template: `
    <div style="padding: 20px; background: #f5f5f5; margin: 20px; border-radius: 8px;">
      <h3>🧪 Test de configuration Stripe</h3>
      
      <div style="margin: 10px 0;">
        <strong>Configuration:</strong><br>
        <span [style.color]="hasPublicKey ? 'green' : 'red'">
          ✓ Clé publique: {{ hasPublicKey ? 'Configurée' : 'MANQUANTE' }}
        </span><br>
        <small *ngIf="hasPublicKey">{{ publicKeyPrefix }}...</small>
      </div>
      
      <div style="margin: 10px 0;">
        <strong>État du service:</strong><br>
        <span [style.color]="isLoaded ? 'green' : 'orange'">
          {{ isLoaded ? '✅ Stripe chargé' : '⏳ En cours de chargement...' }}
        </span>
      </div>
      
      <div style="margin: 10px 0;">
        <button (click)="testLoad()" [disabled]="loading" style="padding: 8px 16px;">
          {{ loading ? 'Test en cours...' : 'Tester le chargement' }}
        </button>
      </div>
      
      <div *ngIf="result" style="margin: 10px 0; padding: 10px; border-radius: 4px;"
           [style.background-color]="result.success ? '#d4edda' : '#f8d7da'"
           [style.color]="result.success ? '#155724' : '#721c24'">
        <strong>Résultat:</strong> {{ result.message }}
      </div>
      
      <div style="margin: 10px 0; font-size: 12px; color: #666;">
        <strong>Variables d'environnement:</strong><br>
        Production: {{ environment.production }}<br>
        API URL: {{ environment.apiUrl }}<br>
        Stripe Key (premiers caractères): {{ publicKeyPrefix || 'Non définie' }}
      </div>
    </div>
  `
})
export class StripeTestComponent implements OnInit {
  hasPublicKey = false;
  publicKeyPrefix = '';
  isLoaded = false;
  loading = false;
  result: { success: boolean; message: string } | null = null;
  environment = environment;

  constructor(public stripeService: StripeService) {}

  ngOnInit(): void {
    this.checkConfiguration();
    this.checkIfLoaded();
  }

  private checkConfiguration(): void {
    this.hasPublicKey = !!environment.stripePublicKey;
    if (this.hasPublicKey) {
      this.publicKeyPrefix = environment.stripePublicKey.substring(0, 12);
    }
  }

  private checkIfLoaded(): void {
    this.isLoaded = this.stripeService.isLoaded();
  }

  async testLoad(): Promise<void> {
    this.loading = true;
    this.result = null;

    try {
      if (!this.hasPublicKey) {
        throw new Error('Clé publique Stripe non configurée dans environment.ts');
      }

      await this.stripeService.loadStripe();
      
      this.isLoaded = this.stripeService.isLoaded();
      
      if (this.isLoaded) {
        this.result = {
          success: true,
          message: 'Stripe chargé avec succès ! Le système de paiement est prêt.'
        };
      } else {
        this.result = {
          success: false,
          message: 'Erreur: Stripe ne semble pas être chargé correctement.'
        };
      }
    } catch (error) {
      this.result = {
        success: false,
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    } finally {
      this.loading = false;
    }
  }
}

