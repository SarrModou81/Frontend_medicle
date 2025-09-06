// src/app/components/patient/paiement/paiement.component.ts - VERSION OPTIMISÉE
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService, RendezVous } from '../../../services/api.service';
import { StripeService } from '../../../services/stripe.service';

@Component({
  selector: 'app-paiement',
  templateUrl: './paiement.component.html',
  styleUrls: ['./paiement.component.scss']
})
export class PaiementComponent implements OnInit, OnDestroy, AfterViewInit {
  rendezVous: RendezVous | null = null;
  paiementForm!: FormGroup;
  isLoading = true;
  isProcessing = false;
  
  // Stripe
  card: any = null;
  cardMounted = false;
  stripeError: string = '';
  
  // Simplification des états
  rdvId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private apiService: ApiService,
    private stripeService: StripeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    console.log('💳 Initialisation paiement optimisée');
    
    const rdvIdParam = this.route.snapshot.paramMap.get('rendezVousId') || this.route.snapshot.paramMap.get('id');
    this.rdvId = Number(rdvIdParam);
    
    if (!this.rdvId || isNaN(this.rdvId)) {
      this.showError('Identifiant de rendez-vous invalide');
      this.router.navigate(['/dashboard/patient/rendez-vous']);
      return;
    }

    this.initializeForm();
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Délai réduit pour l'initialisation Stripe
    setTimeout(() => {
      this.initializeStripe();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.card) {
      try {
        this.card.destroy();
      } catch (error) {
        console.log('Card déjà détruit');
      }
    }
  }

  private initializeForm(): void {
    this.paiementForm = this.fb.group({
      methode: ['stripe', Validators.required],
      accepteConditions: [false, Validators.requiredTrue]
    });
  }

  /**
   * Chargement optimisé des données
   */
  private async loadData(): Promise<void> {
    try {
      const response = await this.apiService.getRendezVous(this.rdvId).toPromise();
      
      if (response?.success && response.data) {
        this.rendezVous = response.data;
        
        if (this.rendezVous.statut_paiement === 'paye') {
          this.showError('Ce rendez-vous a déjà été payé');
          this.router.navigate(['/dashboard/patient/rendez-vous']);
          return;
        }
        
        console.log('✅ Rendez-vous chargé');
      } else {
        throw new Error('Rendez-vous non trouvé');
      }
    } catch (error) {
      console.error('❌ Erreur chargement RDV:', error);
      this.showError('Erreur lors du chargement du rendez-vous');
      this.router.navigate(['/dashboard/patient/rendez-vous']);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Initialisation Stripe optimisée
   */
   async initializeStripe(): Promise<void> {
    try {
      console.log('💳 Chargement Stripe...');
      
      await this.stripeService.loadStripe();
      
      if (document.getElementById('card-element')) {
        this.mountCard();
      } else {
        // Réessayer après un court délai
        setTimeout(() => {
          if (document.getElementById('card-element')) {
            this.mountCard();
          }
        }, 500);
      }
    } catch (error) {
      console.error('❌ Erreur Stripe:', error);
      this.stripeError = 'Impossible de charger le système de paiement';
      this.showError('Erreur lors de l\'initialisation du paiement');
    }
  }

  /**
   * Montage de la carte simplifié
   */
  private mountCard(): void {
    try {
      if (this.cardMounted) return;
      
      this.card = this.stripeService.createCardElement();
      this.card.mount('#card-element');
      this.cardMounted = true;
      
      console.log('✅ Carte montée rapidement');

      // Gestion des erreurs en temps réel
      this.card.on('change', (event: any) => {
        const displayError = document.getElementById('card-errors');
        if (displayError) {
          if (event.error) {
            displayError.textContent = this.stripeService.translateError(event.error.message);
            this.stripeError = event.error.message;
          } else {
            displayError.textContent = '';
            this.stripeError = '';
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur montage carte:', error);
      this.stripeError = 'Erreur lors du montage de la carte';
    }
  }

  /**
   * Soumission optimisée
   */
  async onSubmit(): Promise<void> {
    if (!this.paiementForm.valid || !this.rendezVous || this.isProcessing) {
      this.markFormGroupTouched();
      return;
    }

    if (!this.stripeService.isLoaded() || !this.card || !this.cardMounted) {
      this.showError('Système de paiement non prêt. Veuillez rafraîchir la page.');
      return;
    }

    console.log('💰 Début paiement optimisé');
    this.isProcessing = true;

    try {
      // 1. Créer le paiement
      const paiementResponse = await this.apiService.creerPaiement({
        rendez_vous_id: this.rdvId,
        methode: 'stripe'
      }).toPromise();

      if (!paiementResponse?.success || !paiementResponse.client_secret) {
        throw new Error('Erreur lors de la création du paiement');
      }

      console.log('✅ Paiement créé');

      // 2. Confirmer avec Stripe
      const billingDetails = {
        name: this.getPatientName(),
        email: this.rendezVous?.patient?.user?.email || ''
      };

      const result = await this.stripeService.confirmCardPayment(
        paiementResponse.client_secret,
        this.card,
        billingDetails
      );

      if (result.error) {
        throw new Error(this.stripeService.translateError(result.error.message));
      }

      console.log('✅ Paiement confirmé côté Stripe');

      // 3. Confirmer côté serveur
      if (paiementResponse.paiement_id) {
        await this.confirmerCoteServeur(paiementResponse.paiement_id);
      } else {
        throw new Error('ID de paiement manquant');
      }

    } catch (error: any) {
      this.isProcessing = false;
      console.error('❌ Erreur paiement:', error);
      this.showError(error.message || 'Erreur lors du paiement');
    }
  }

  /**
   * Confirmation côté serveur optimisée
   */
  private async confirmerCoteServeur(paiementId: number): Promise<void> {
    try {
      const confirmResponse = await this.apiService.confirmerPaiement(paiementId).toPromise();
      
      if (confirmResponse?.success) {
        console.log('🎉 Paiement confirmé côté serveur');
        
        this.showSuccess('Paiement effectué avec succès !');
        
        // Redirection après délai
        setTimeout(() => {
          this.router.navigate(['/dashboard/patient/rendez-vous']);
        }, 1500);
      } else {
        throw new Error(confirmResponse?.message || 'Erreur de confirmation');
      }
    } catch (error: any) {
      console.error('❌ Erreur confirmation serveur:', error);
      this.showError('Paiement traité mais erreur de synchronisation. Contactez le support si nécessaire.');
      
      // Rediriger quand même après un délai
      setTimeout(() => {
        this.router.navigate(['/dashboard/patient/rendez-vous']);
      }, 3000);
    } finally {
      this.isProcessing = false;
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.paiementForm.controls).forEach(key => {
      const control = this.paiementForm.get(key);
      control?.markAsTouched();
    });
  }

  private getPatientName(): string {
    if (this.rendezVous?.patient?.user) {
      return `${this.rendezVous.patient.user.prenom} ${this.rendezVous.patient.user.nom}`;
    }
    return 'Patient';
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  retourner(): void {
    this.router.navigate(['/dashboard/patient/rendez-vous']);
  }

  formatPrix(prix: number): string {
    if (!prix) return '0 FCFA';
    
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(prix);
  }

  // ===== GETTERS POUR LE TEMPLATE =====
  
  get isFormValid(): boolean {
    return this.paiementForm.valid && this.cardMounted && !this.isProcessing && this.stripeService.isLoaded() && !this.stripeError;
  }

  get stripeReady(): boolean {
    return this.stripeService.isLoaded() && this.cardMounted && !this.stripeError;
  }

  get hasStripeError(): boolean {
    return !!this.stripeError;
  }

  get isProduction(): boolean {
    return false; // Toujours false en développement
  }
}