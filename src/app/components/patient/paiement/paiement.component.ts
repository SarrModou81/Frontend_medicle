// src/app/components/patient/paiement/paiement.component.ts - VERSION CORRIGÉE
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService, RendezVous } from '../../../services/api.service';
import { environment } from '../../../../environments/environment';

// Déclaration pour Stripe
declare var Stripe: any;

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
  stripe: any = null;
  elements: any = null;
  card: any = null;
  
  // Paramètres
  rdvId: number = 0;
  clientSecret: string = '';
  
  // Pour éviter les fuites mémoire
  private stripeLoaded = false;
  private cardMounted = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Récupérer l'ID du rendez-vous depuis la route
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
    this.loadStripe();
  }

  ngAfterViewInit(): void {
    // Initialiser Stripe après que la vue soit chargée
    if (this.stripeLoaded && !this.cardMounted) {
      this.initializeStripeElements();
    }
  }

  ngOnDestroy(): void {
    // Nettoyer les éléments Stripe
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
    this.apiService.getRendezVous(this.rdvId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.rendezVous = response.data;
          
          // Vérifier que le rendez-vous peut être payé
          if (this.rendezVous.statut_paiement === 'paye') {
            this.snackBar.open('Ce rendez-vous a déjà été payé', 'Fermer', {
              duration: 3000,
              panelClass: ['warning-snackbar']
            });
            this.router.navigate(['/dashboard/patient/rendez-vous']);
            return;
          }
          
          this.isLoading = false;
        } else {
          this.handleError('Rendez-vous non trouvé');
        }
      },
      error: (error) => {
        console.error('Erreur chargement RDV:', error);
        this.handleError('Erreur lors du chargement du rendez-vous');
      }
    });
  }

  private loadStripe(): void {
    // Vérifier si Stripe est déjà chargé
    if (typeof Stripe !== 'undefined') {
      this.initializeStripe();
      return;
    }

    // Charger Stripe dynamiquement
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => {
      this.initializeStripe();
    };
    script.onerror = () => {
      this.snackBar.open('Erreur lors du chargement de Stripe', 'Fermer', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    };
    document.head.appendChild(script);
  }

  private initializeStripe(): void {
    try {
      if (!environment.stripePublicKey) {
        console.error('Clé publique Stripe manquante');
        return;
      }

      this.stripe = Stripe(environment.stripePublicKey);
      this.elements = this.stripe.elements();
      this.stripeLoaded = true;

      // Si la vue est déjà chargée, initialiser les éléments
      if (document.getElementById('card-element')) {
        this.initializeStripeElements();
      }
    } catch (error) {
      console.error('Erreur initialisation Stripe:', error);
      this.snackBar.open('Erreur lors de l\'initialisation du paiement', 'Fermer', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  private initializeStripeElements(): void {
    if (this.cardMounted || !this.elements) return;

    const style = {
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
    };

    try {
      this.card = this.elements.create('card', { 
        style: style,
        hidePostalCode: true // Cacher le code postal si non nécessaire
      });

      const cardElement = document.getElementById('card-element');
      if (cardElement) {
        this.card.mount('#card-element');
        this.cardMounted = true;

        // Gérer les erreurs en temps réel
        this.card.on('change', ({ error }: any) => {
          const displayError = document.getElementById('card-errors');
          if (displayError) {
            if (error) {
              displayError.textContent = this.translateStripeError(error.message);
            } else {
              displayError.textContent = '';
            }
          }
        });
      }
    } catch (error) {
      console.error('Erreur montage carte Stripe:', error);
    }
  }

  onSubmit(): void {
    if (!this.paiementForm.valid || !this.rendezVous || this.isProcessing) {
      this.markFormGroupTouched();
      return;
    }

    if (!this.stripe || !this.card) {
      this.snackBar.open('Système de paiement non initialisé', 'Fermer', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isProcessing = true;

    // Créer le PaymentIntent
    this.apiService.creerPaiement({
      rendez_vous_id: this.rdvId,
      methode: 'stripe'
    }).subscribe({
      next: (response) => {
        if (response.success && response.client_secret) {
          this.clientSecret = response.client_secret;
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
        const errorMessage = error.error?.message || 'Erreur lors de la création du paiement';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private confirmerPaiement(): void {
    if (!this.clientSecret || !this.stripe || !this.card) {
      this.isProcessing = false;
      return;
    }

    this.stripe.confirmCardPayment(this.clientSecret, {
      payment_method: {
        card: this.card,
        billing_details: {
          name: this.getPatientName(),
          email: this.rendezVous?.patient?.user?.email || ''
        }
      }
    }).then((result: any) => {
      this.isProcessing = false;
      
      if (result.error) {
        // Erreur de paiement
        const errorMessage = this.translateStripeError(result.error.message);
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      } else {
        // Paiement réussi
        this.snackBar.open('Paiement effectué avec succès !', 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        // Rediriger vers les rendez-vous avec un délai pour laisser le temps de voir le message
        setTimeout(() => {
          this.router.navigate(['/dashboard/patient/rendez-vous']);
        }, 1500);
      }
    }).catch((error: any) => {
      this.isProcessing = false;
      console.error('Erreur confirmation paiement:', error);
      this.snackBar.open('Erreur inattendue lors du paiement', 'Fermer', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
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

  private translateStripeError(message: string): string {
    // Traduire les erreurs Stripe courantes
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

  // Getters pour le template
  get isFormValid(): boolean {
    return this.paiementForm.valid && this.cardMounted && !this.isProcessing;
  }

  get patientName(): string {
    return this.getPatientName();
  }
}