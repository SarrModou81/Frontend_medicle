// src/app/components/patient/paiement/paiement.component.ts - VERSION CORRIGÉE AVEC CONFIRMATION AUTO
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
  
  // Paramètres
  rdvId: number = 0;
  clientSecret: string = '';
  paiementId: number = 0; // AJOUT : ID du paiement créé

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private apiService: ApiService,
    public stripeService: StripeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    console.log('🔄 Initialisation du composant paiement');
    
    const rdvIdParam = this.route.snapshot.paramMap.get('rendezVousId') || this.route.snapshot.paramMap.get('id');
    this.rdvId = Number(rdvIdParam);
    
    if (!this.rdvId || isNaN(this.rdvId)) {
      this.snackBar.open('Identifiant de rendez-vous invalide', 'Fermer', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      this.router.navigate(['/dashboard/patient/rendez-vous']);
      return;
    }

    this.initializeForm();
    this.loadRendezVous();
    this.initializeStripe();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.stripeService.isLoaded() && !this.cardMounted) {
        this.mountCardElement();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.card) {
      this.card.destroy();
    }
  }

  private initializeForm(): void {
    this.paiementForm = this.fb.group({
      methode: ['stripe', Validators.required],
      accepteConditions: [false, Validators.requiredTrue]
    });
  }

  private loadRendezVous(): void {
    console.log('📋 Chargement du rendez-vous:', this.rdvId);
    
    this.apiService.getRendezVous(this.rdvId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.rendezVous = response.data;
          
          if (this.rendezVous.statut_paiement === 'paye') {
            this.snackBar.open('Ce rendez-vous a déjà été payé', 'Fermer', {
              duration: 3000,
              panelClass: ['warning-snackbar']
            });
            this.router.navigate(['/dashboard/patient/rendez-vous']);
            return;
          }
          
          console.log('✅ Rendez-vous chargé:', this.rendezVous);
          this.isLoading = false;
        } else {
          this.handleError('Rendez-vous non trouvé');
        }
      },
      error: (error) => {
        console.error('❌ Erreur chargement RDV:', error);
        this.handleError('Erreur lors du chargement du rendez-vous');
      }
    });
  }

  private async initializeStripe(): Promise<void> {
    console.log('💳 Initialisation de Stripe...');
    
    try {
      await this.stripeService.loadStripe();
      console.log('✅ Stripe chargé avec succès');
      
      if (document.getElementById('card-element')) {
        this.mountCardElement();
      }
    } catch (error) {
      console.error('❌ Erreur initialisation Stripe:', error);
      this.snackBar.open('Erreur lors de l\'initialisation du paiement', 'Fermer', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  private mountCardElement(): void {
    if (this.cardMounted || !this.stripeService.isLoaded()) {
      return;
    }

    console.log('🔧 Montage de l\'élément carte...');

    try {
      this.card = this.stripeService.createCardElement();

      const cardElement = document.getElementById('card-element');
      if (cardElement) {
        this.card.mount('#card-element');
        this.cardMounted = true;
        console.log('✅ Élément carte monté');

        this.card.on('change', ({ error }: any) => {
          const displayError = document.getElementById('card-errors');
          if (displayError) {
            if (error) {
              displayError.textContent = this.stripeService.translateError(error.message);
            } else {
              displayError.textContent = '';
            }
          }
        });
      } else {
        console.error('❌ Élément #card-element non trouvé');
      }
    } catch (error) {
      console.error('❌ Erreur montage carte:', error);
      this.snackBar.open('Erreur lors de l\'initialisation de la carte', 'Fermer', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  onSubmit(): void {
    if (!this.paiementForm.valid || !this.rendezVous || this.isProcessing) {
      this.markFormGroupTouched();
      return;
    }

    if (!this.stripeService.isLoaded() || !this.card || !this.cardMounted) {
      this.snackBar.open('Système de paiement non initialisé. Veuillez rafraîchir la page.', 'Fermer', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    console.log('💰 Début du processus de paiement');
    this.isProcessing = true;

    // Créer le PaymentIntent
    this.apiService.creerPaiement({
      rendez_vous_id: this.rdvId,
      methode: 'stripe'
    }).subscribe({
      next: (response) => {
        if (response.success && response.client_secret) {
          this.clientSecret = response.client_secret;
          this.paiementId = response.paiement_id; // AJOUT : Stocker l'ID du paiement
          console.log('✅ PaymentIntent créé');
          this.confirmerPaiement();
        } else {
          this.isProcessing = false;
          this.snackBar.open('Erreur lors de la création du paiement', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error) => {
        this.isProcessing = false;
        console.error('❌ Erreur création paiement:', error);
        const errorMessage = error.error?.message || 'Erreur lors de la création du paiement';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private async confirmerPaiement(): Promise<void> {
    if (!this.clientSecret || !this.card) {
      this.isProcessing = false;
      return;
    }

    console.log('🔐 Confirmation du paiement...');

    try {
      const billingDetails = {
        name: this.getPatientName(),
        email: this.rendezVous?.patient?.user?.email || ''
      };

      const result = await this.stripeService.confirmCardPayment(
        this.clientSecret,
        this.card,
        billingDetails
      );
      
      if (result.error) {
        // GESTION D'ERREUR AMÉLIORÉE
        this.isProcessing = false;
        console.error('❌ Erreur paiement:', result.error);
        
        let errorMessage = 'Erreur de paiement';
        
        if (result.error.type === 'card_error') {
          if (result.error.code === 'card_declined') {
            errorMessage = 'Carte refusée. Vérifiez vos informations ou utilisez une autre carte.';
          } else if (result.error.code === 'expired_card') {
            errorMessage = 'Votre carte a expiré.';
          } else if (result.error.code === 'insufficient_funds') {
            errorMessage = 'Fonds insuffisants sur votre carte.';
          } else if (result.error.code === 'incorrect_cvc') {
            errorMessage = 'Code de sécurité incorrect.';
          } else {
            errorMessage = this.stripeService.translateError(result.error.message);
          }
        }
        
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      } else {
        // PAIEMENT RÉUSSI CÔTÉ STRIPE - MAINTENANT CONFIRMER CÔTÉ SERVEUR
        console.log('✅ Paiement réussi côté Stripe:', result.paymentIntent);
        
        this.confirmerPaiementCoteServeur();
      }
    } catch (error) {
      this.isProcessing = false;
      console.error('❌ Erreur confirmation paiement:', error);
      this.snackBar.open('Erreur inattendue lors du paiement', 'Fermer', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  // NOUVELLE MÉTHODE : Confirmer le paiement côté serveur après succès Stripe
  private confirmerPaiementCoteServeur(): void {
    console.log('📡 Confirmation côté serveur...');
    
    this.apiService.confirmerPaiement(this.paiementId).subscribe({
      next: (response) => {
        this.isProcessing = false;
        
        if (response.success) {
          console.log('🎉 Paiement confirmé côté serveur');
          
          this.snackBar.open('Paiement effectué avec succès !', 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          // Rediriger vers les rendez-vous avec un délai
          setTimeout(() => {
            this.router.navigate(['/dashboard/patient/rendez-vous']);
          }, 1500);
        } else {
          console.error('❌ Échec confirmation serveur:', response.message);
          this.snackBar.open('Erreur de confirmation: ' + (response.message || 'Erreur inconnue'), 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error) => {
        this.isProcessing = false;
        console.error('❌ Erreur confirmation serveur:', error);
        
        // Le paiement a réussi côté Stripe mais a échoué côté serveur
        // Informer l'utilisateur et lui donner des instructions
        this.snackBar.open(
          'Paiement traité par la banque mais erreur de synchronisation. Contactez le support si nécessaire.', 
          'Fermer', 
          {
            duration: 8000,
            panelClass: ['warning-snackbar']
          }
        );
        
        // Rediriger quand même vers les rendez-vous après un délai
        setTimeout(() => {
          this.router.navigate(['/dashboard/patient/rendez-vous']);
        }, 3000);
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.paiementForm.controls).forEach(key => {
      const control = this.paiementForm.get(key);
      control?.markAsTouched();
    });
  }

  private handleError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
    this.router.navigate(['/dashboard/patient/rendez-vous']);
  }

  private getPatientName(): string {
    if (this.rendezVous?.patient?.user) {
      return `${this.rendezVous.patient.user.prenom} ${this.rendezVous.patient.user.nom}`;
    }
    return 'Patient';
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

  // ===== GETTERS PUBLICS POUR LE TEMPLATE =====
  
  get isFormValid(): boolean {
    return this.paiementForm.valid && this.cardMounted && !this.isProcessing && this.stripeService.isLoaded();
  }

  get patientName(): string {
    return this.getPatientName();
  }

  get stripeReady(): boolean {
    return this.stripeService.isLoaded() && this.cardMounted;
  }

  get isStripeLoaded(): boolean {
    return this.stripeService.isLoaded();
  }

  get isCardMounted(): boolean {
    return this.cardMounted;
  }
}